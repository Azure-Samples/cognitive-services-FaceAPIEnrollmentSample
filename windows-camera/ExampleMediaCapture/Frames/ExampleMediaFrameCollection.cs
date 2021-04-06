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
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Windows.Foundation;
using Windows.Media.Capture.Frames;

namespace Examples.Media.Capture.Frames
{
    internal enum ExampleMediaFrameCollectionFailureReason
    {
        NullMediaFrameReference,
        NullVideoMediaFrame,
        NullSystemRelativeTime
    }

    public sealed class ExampleMediaFrameCollection : IDisposable
    {
        public void Dispose()
        {
            DelayedProcessingTrigger.Dispose();
            while (Frames.TryDequeue(out var frame))
            {
                frame.Dispose();
            }

            while (DetectedFaceEpochs.TryDequeue(out var epoch)) { }
            while (FailureReasons.TryDequeue(out var epoch)) { }

            ProcessingFrames.Clear();
            ProcessingDetectedFaceEpochs.Clear();
        }

        public event TypedEventHandler<ExampleMediaFrameCollection, ExampleMediaFrameCollectionProgressedEventArgs> CollectionProgressed;

        public int MaxDetectedFaces { get; set; } = 1;
        public TimeSpan FrameCorrelationTimeSpan { get; set; } = TimeSpan.FromMilliseconds(250);
        public TimeSpan FaceDetectionLatency { get; set; } = TimeSpan.FromSeconds(3);

        public ExampleMediaFrameCollection(ExampleMediaCapture ExampleMediaCapture)
        {
            Frames = new ConcurrentQueue<ExampleMediaFrame>();
            ExampleMediaCapture.FaceDetected += ExampleMediaCapture_FaceDetected;
            DelayedProcessingTrigger = new Timer(TriggerProcessing, null, TimeSpan.Zero, TimeSpan.FromSeconds(1));
        }

        public void Add(MediaFrameReference frame)
        {
            if (frame == null)
            {
                FailureReasons.Enqueue(ExampleMediaFrameCollectionFailureReason.NullMediaFrameReference);
                return;
            }

            if (frame.VideoMediaFrame == null)
            {
                FailureReasons.Enqueue(ExampleMediaFrameCollectionFailureReason.NullVideoMediaFrame);
                return;
            }

            if (frame.SystemRelativeTime == null)
            {
                FailureReasons.Enqueue(ExampleMediaFrameCollectionFailureReason.NullSystemRelativeTime);
                return;
            }

            Frames.Enqueue(new ExampleMediaFrame(frame.VideoMediaFrame));

            Update(frame.SystemRelativeTime.Value);
        }

        private TimeSpan MostRecentObservedSystemRelativeTime { get; set; } = TimeSpan.Zero;
        private ConcurrentQueue<ExampleMediaFrame> Frames { get; } = new ConcurrentQueue<ExampleMediaFrame>();
        private ConcurrentQueue<TimeSpan> DetectedFaceEpochs { get; } = new ConcurrentQueue<TimeSpan>();
        private ConcurrentQueue<ExampleMediaFrameCollectionFailureReason> FailureReasons { get; } = new ConcurrentQueue<ExampleMediaFrameCollectionFailureReason>();
        private List<ExampleMediaFrame> ProcessingFrames { get; set; } = new List<ExampleMediaFrame>();
        private SortedSet<TimeSpan> ProcessingDetectedFaceEpochs { get; } = new SortedSet<TimeSpan>();

        private object ProcessingThreadSyncRoot { get; } = new object();
        private object ProcessingSyncRoot { get; } = new object();
        private Task ProcessingThread { get; set; }
        private Timer DelayedProcessingTrigger { get; set; }

        private void ExampleMediaCapture_FaceDetected(ExampleMediaCapture sender, FaceAnalysis.FaceDetectedEventArgs args)
        {
            if (args.ResultFrame.SystemRelativeTime.HasValue &&
                args.ResultFrame.DetectedFaces.Any() &&
                args.ResultFrame.DetectedFaces.Count <= MaxDetectedFaces)
            {
                DetectedFaceEpochs.Enqueue(args.ResultFrame.SystemRelativeTime.Value);
                Update(args.ResultFrame.SystemRelativeTime.Value);
            }
        }

        private void TriggerProcessing(object state = null)
        {
            lock (ProcessingThreadSyncRoot)
            {
                if (ProcessingThread == null || ProcessingThread.IsCompleted)
                {
                    ProcessingThread = Task.Run(ProcessAsync);
                }
            }
        }

        private void Update(TimeSpan systemRelativeTime)
        {
            if (systemRelativeTime > MostRecentObservedSystemRelativeTime)
            {
                MostRecentObservedSystemRelativeTime = systemRelativeTime;
            }

            TriggerProcessing();
        }

        private async void ProcessAsync()
        {
            if (Monitor.TryEnter(ProcessingSyncRoot, TimeSpan.FromMilliseconds(100)))
            {
                try
                {

                    while (Frames.TryDequeue(out var frame))
                    {
                        ProcessingFrames.Add(frame);
                    }

                    while (DetectedFaceEpochs.TryDequeue(out var epoch))
                    {
                        ProcessingDetectedFaceEpochs.Add(epoch);
                    }

                    if (!ProcessingFrames.Any() ||
                        !ProcessingDetectedFaceEpochs.Any())
                    {
                        return;
                    }

                    var expiredFaceDetectionEpochs = new List<TimeSpan>();
                    foreach (var epoch in ProcessingDetectedFaceEpochs)
                    {
                        if (MostRecentObservedSystemRelativeTime - epoch > FaceDetectionLatency)
                        {
                            expiredFaceDetectionEpochs.Add(epoch);
                            continue;
                        }

                        var framesByCorrelation = ProcessingFrames.GroupBy(frame => (frame.SystemRelativeTime.Value - epoch).Duration() < FrameCorrelationTimeSpan);
                        ProcessingFrames = framesByCorrelation.Where(g => g.Key == false).SelectMany(g => g).ToList();
                        var correlatedFrames = framesByCorrelation.Where(g => g.Key == true).SelectMany(g => g);

                        foreach (var correlatedFrame in correlatedFrames)
                        {
                            CollectionProgressed?.Invoke(this, new ExampleMediaFrameCollectionProgressedEventArgs(correlatedFrame));
                        }
                    }

                    foreach (var epoch in expiredFaceDetectionEpochs)
                    {
                        ProcessingDetectedFaceEpochs.Remove(epoch);
                    }

                }
                finally
                {
                    ProcessingFrames = ProcessingFrames.Where(frame => (frame.SystemRelativeTime.Value - MostRecentObservedSystemRelativeTime).Duration() < FaceDetectionLatency).ToList();
                    Monitor.Exit(ProcessingSyncRoot);
                }
            }
            await Task.Delay(TimeSpan.FromMilliseconds(100));
        }
    }
}
