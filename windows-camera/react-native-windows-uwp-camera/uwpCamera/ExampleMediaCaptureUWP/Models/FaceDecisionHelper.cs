////////////////////////////////////////////////////////////
//
// Copyright (c) Microsoft Corporation. All rights reserved.
// This code is licensed under the MIT License (MIT).
// THIS CODE IS PROVIDED *AS IS* WITHOUT WARRANTY OF
// ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING ANY
// IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR
// PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.
//
////////////////////////////////////////////////////////////

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reactive.Concurrency;
using System.Reactive.Linq;
using System.Reactive.Threading.Tasks;
using System.Text;
using System.Threading.Tasks;
using System.Threading.Tasks.Dataflow;
using Windows.Foundation;

namespace ExampleMediaCaptureUWP.Models
{
    public static partial class Mock
    {
        static Random Random = new Random();

        public static async Task SimulateLowQoSNetworkAsync()
        {
            var random = Random.NextDouble();
            if (random < .05)
            {
            }
            else if (random < .8)
            {
                await Task.Delay(TimeSpan.FromSeconds(random * 3));
            }
            else if (random < .95)
            {
                await Task.Delay(TimeSpan.FromSeconds(random * 20));
            }

            random = Random.NextDouble();
            if (random < .95)
            {
                return;
            }
            else
            {
                throw new Exception();
            }
        }

        public static async Task<IEnumerable<Guid?>> DetectFaceAsync(IFaceStream input)
        {
            await SimulateLowQoSNetworkAsync();

            var random = Random.NextDouble();
            if (random < .98)
            {
                return Enumerable.Range(0, 1).Select(_ => (Guid?)Guid.NewGuid());
            }
            else if (random < .99)
            {
                return Enumerable.Range(0, 2).Select(_ => (Guid?)Guid.NewGuid());
            }
            else
            {
                return new Guid?[] { };
            }
        }

        public static async Task<Guid?> RecognizeFaceAsync(Guid faceId)
        {
            await SimulateLowQoSNetworkAsync();

            var random = Random.NextDouble();
            if (random < .98)
            {
                return Guid.NewGuid();
            }
            else
            {
                return null;
            }
        }

        public static async Task<bool> DetermineAccessAsync(Guid personId)
        {
            await SimulateLowQoSNetworkAsync();

            var random = Random.NextDouble();
            return random < .5;
        }

        public static async Task<IEnumerable<bool>> DetermineAccessAsync(IFaceStream input)
        {
            try
            {
                return await DetectFaceAsync(input)
                    .ContinueWith(
                        task => task.Result
                            .Where(faceId => faceId.HasValue)
                            .Select(faceId => RecognizeFaceAsync(faceId.Value)))
                    .ContinueWith(
                        task => task.Result.AsCompleted()
                            .Where(personId => personId.HasValue)
                            .Select(personId => DetermineAccessAsync(personId.Value)))
                    .ContinueWith(
                        task => task.Result.AsCompleted());
            }
            finally
            {
                input.FaceStream.Dispose();
            }
        }


    }

    public interface IFaceStream
    {
        Stream FaceStream { get; }
    }

    class Face : IFaceStream
    {
        public Stream FaceStream { get; private set; }
    }

    class FaceDecisionHelper
    {
        volatile int _failureCount = 0;

        public FaceDecisionHelper(int maxDegreeOfParallelism, bool dropWhenFull)
        {
            ProcessingBlock = new TransformManyBlock<IFaceStream, bool>(
                transform: Mock.DetermineAccessAsync,
                dataflowBlockOptions: new ExecutionDataflowBlockOptions
                {
                    MaxDegreeOfParallelism = maxDegreeOfParallelism,
                    BoundedCapacity = dropWhenFull ? maxDegreeOfParallelism : DataflowBlockOptions.Unbounded,
                });
            DecisionBlock = new ActionBlock<bool>(decision =>
            {
                bool? finalDecision = null;
                if (!decision) ++_failureCount;
                if (decision || _failureCount > 7)
                {
                    finalDecision = decision;
                }

                if (finalDecision.HasValue)
                {
                    DecisionAvailable?.Invoke(this, finalDecision.Value);
                    ProcessingBlock.Complete();
                }
            });

            ProcessingBlock.LinkTo(DecisionBlock);
            ProcessingBlock.Completion.ContinueWith(delegate { DecisionBlock.Complete(); });
        }

        public void Post(IFaceStream stream)
        {
            ProcessingBlock.Post(stream);
        }

        TransformManyBlock<IFaceStream, bool> ProcessingBlock { get; }
        ActionBlock<bool> DecisionBlock { get; }

        public event TypedEventHandler<FaceDecisionHelper, bool> DecisionAvailable;
    }
}
