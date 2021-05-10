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

using Examples.Media.Capture.Internal;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Windows.Foundation;
using Windows.Media.Capture.Frames;
using Windows.Media.Core;
using Windows.Media.FaceAnalysis;

namespace Examples.Media.Capture.Frames
{
    public sealed class ExampleMediaFrameReader : IDisposable
    {
        public MediaFrameReaderAcquisitionMode AcquisitionMode
        {
            get => MediaFrameReaders.Values.First().AcquisitionMode;
            set
            {
                foreach (var frameReader in MediaFrameReaders.Values)
                {
                    frameReader.AcquisitionMode = value;
                }
            }
        }

        public IAsyncOperation<IDictionary<MediaFrameSourceKind, MediaFrameReaderStartStatus>> StartAsync() => StartAsync_Impl().AsAsyncOperation();
        internal async Task<IDictionary<MediaFrameSourceKind, MediaFrameReaderStartStatus>> StartAsync_Impl()
        {
            if (IsBusy) throw new InvalidOperationException();

            IsBusy = true;

            var statuses = new Dictionary<MediaFrameSourceKind, MediaFrameReaderStartStatus>();

            foreach (var typedFrameReader in MediaFrameReaders)
            {
                var sourceKind = typedFrameReader.Key;
                var frameReader = typedFrameReader.Value;

                statuses[sourceKind] = await frameReader.StartAsync();
            }

            if (FaceDetectionAffinity == ExampleMediaCaptureFaceDetectionAffinity.FrameReader)
            {
                statuses[MediaFrameSourceKind.Custom] = await FaceDetectionMediaFrameReader.StartAsync();
            }

            IsBusy = false;

            return statuses;
        }

        public IAsyncAction StopAsync() => StopAsync_Impl().AsAsyncAction();
        internal async Task StopAsync_Impl()
        {
            if (IsBusy) throw new InvalidOperationException();

            IsBusy = true;

            foreach (var typedFrameReader in MediaFrameReaders)
            {
                var sourceKind = typedFrameReader.Key;
                var frameReader = typedFrameReader.Value;

                await frameReader.StopAsync();
            }

            if (FaceDetectionAffinity == ExampleMediaCaptureFaceDetectionAffinity.FrameReader)
            {
                await FaceDetectionMediaFrameReader.StopAsync();
            }

            IsBusy = false;
        }

        public ExampleMediaFrameReference TryAcquireLatestFrame()
        {
            try
            {
                lock (FrameArrivedSyncObject)
                {
                    if (FrameCorrelationTimeSpan == null)
                    {
                        return new ExampleMediaFrameReference(LatestFrames.ToDictionary(kvp => kvp.Key, kvp => kvp.Value), false);
                    }
                    else
                    {
                        return new ExampleMediaFrameReference(LatestFrames.ToDictionary(kvp => kvp.Key, kvp => kvp.Value),
                            LatestFrames.Values.Select(frame => frame?.SystemRelativeTime ?? TimeSpan.Zero).Max() - FaceDetectedSystemRelativeTime < FrameCorrelationTimeSpan);
                    }
                }
            }
            finally
            {
                lock (FrameArrivedSyncObject)
                {
                    var sourceKinds = LatestFrames.Keys.ToList();
                    foreach (var sourceKind in sourceKinds)
                    {
                        LatestFrames[sourceKind] = null;
                    }
                }
            }
        }

        public MediaFrameReference TryAcquireLatestFrameBySourceKind(MediaFrameSourceKind sourceKind)
        {
            return MediaFrameReaders[sourceKind].TryAcquireLatestFrame();
        }

        public void Dispose()
        {
            foreach (var frameReader in MediaFrameReaders.Values)
            {
                frameReader.Dispose();
            }
            FaceDetectionEffect.FaceDetected -= FaceDetectionEffect_FaceDetected;
        }

        public event TypedEventHandler<ExampleMediaFrameReader, ExampleMediaFrameArrivedEventArgs> FrameArrived;
        public event TypedEventHandler<ExampleMediaFrameReader, MultiSourceMediaFrameArrivedEventArgs> CorrelatedFrameArrived;

        internal event TypedEventHandler<ExampleMediaFrameReader, FaceAnalysis.FaceDetectedEventArgs> FaceDetected;

        internal ExampleMediaFrameReader(IDictionary<MediaFrameSourceKind, MediaFrameReader> frameReaders, MediaFrameReader faceDetectionFrameReader, FaceDetectionEffect faceDetectionEffect, TimeSpan? frameCorrelationTimeSpan)
        {
            MediaFrameReaders = frameReaders;
            FaceDetectionEffect = faceDetectionEffect;
            FrameCorrelationTimeSpan = frameCorrelationTimeSpan;
            LatestFrames = new Dictionary<MediaFrameSourceKind, MediaFrameReference>();
            FrameArrivedSyncObject = new object();

            foreach (var typedFrameReader in MediaFrameReaders)
            {
                var sourceKind = typedFrameReader.Key;
                var frameReader = typedFrameReader.Value;

                frameReader.FrameArrived += (MediaFrameReader sender, MediaFrameArrivedEventArgs args) => MediaFrameReader_FrameArrived(sender, sourceKind);
                LatestFrames[sourceKind] = null;
            }

            AcquisitionMode = AcquisitionMode;

            if (faceDetectionFrameReader != null)
            {
                FaceTrackerCreationTask = Task.Run(async () => await FaceTracker.CreateAsync());
                FaceDetectionMediaFrameReader = faceDetectionFrameReader;
                FaceDetectionMediaFrameReader.FrameArrived += MediaFrameReader_FaceDetectionFrameArrived;
                FaceDetectionAffinity = ExampleMediaCaptureFaceDetectionAffinity.FrameReader;
            }
            else if (FaceDetectionEffect != null)
            {
                FaceDetectionEffect.FaceDetected += FaceDetectionEffect_FaceDetected;
                FaceDetectionAffinity = ExampleMediaCaptureFaceDetectionAffinity.MediaCapturePreview;
            }
            else
            {
                throw new ArgumentException();
            }
        }

        private volatile int FaceDetectionThreads;
        private volatile bool IsBusy;
        private Task<FaceTracker> FaceTrackerCreationTask { get; }
        private FaceTracker FaceTracker => FaceTrackerCreationTask.Result;

        private TimeSpan? FrameCorrelationTimeSpan { get; set; }

        private TimeSpan FaceDetectedSystemRelativeTime { get; set; } = TimeSpan.Zero;

        private readonly ExampleMediaCaptureFaceDetectionAffinity FaceDetectionAffinity;
        private readonly FaceDetectionEffect FaceDetectionEffect;
        private readonly IDictionary<MediaFrameSourceKind, MediaFrameReference> LatestFrames;
        private readonly IDictionary<MediaFrameSourceKind, MediaFrameReader> MediaFrameReaders;
        private readonly MediaFrameReader FaceDetectionMediaFrameReader;
        private readonly object FrameArrivedSyncObject;

        private async void MediaFrameReader_FaceDetectionFrameArrived(MediaFrameReader sender, MediaFrameArrivedEventArgs args)
        {
            var mediaFrameReference = sender.TryAcquireLatestFrame();
            if (mediaFrameReference == null) return;

            var videoMediaFrame = mediaFrameReference.VideoMediaFrame;
            if (videoMediaFrame == null) return;

            var videoFrame = videoMediaFrame.GetVideoFrame();
            if (videoFrame == null) return;

            if (Interlocked.CompareExchange(ref FaceDetectionThreads, 1, 0) != 0)
            {
                return;
            }

            try
            {
                var faces = await FaceTracker.ProcessNextFrameAsync(videoFrame);
                if (faces.Any())
                {
                    FaceDetected?.Invoke(this, new FaceAnalysis.FaceDetectedEventArgs(new FaceAnalysis.FaceDetectionEffectFrame(videoFrame, faces)));
                }
            }
            finally
            {
                FaceDetectionThreads = 0;
            }
        }

        private void FaceDetectionEffect_FaceDetected(FaceDetectionEffect sender, FaceDetectedEventArgs args)
        {
            FaceDetectedSystemRelativeTime = args.ResultFrame.SystemRelativeTime ?? FaceDetectedSystemRelativeTime;
        }

        private void MediaFrameReader_FrameArrived(MediaFrameReader sender, MediaFrameSourceKind sourceKind)
        {
            if (FrameCorrelationTimeSpan == null)
            {
                FrameArrived?.Invoke(this, new ExampleMediaFrameArrivedEventArgs(sourceKind));
            }
            else
            {
                lock (FrameArrivedSyncObject)
                {
                    LatestFrames[sourceKind] = sender.TryAcquireLatestFrame();
                    var frameTimestamps = LatestFrames.Values.Select(frame => frame?.SystemRelativeTime ?? TimeSpan.Zero).ToList();
                    var frameRange = frameTimestamps.Max() - frameTimestamps.Min();
                    if (frameRange < FrameCorrelationTimeSpan)
                    {
                        CorrelatedFrameArrived?.Invoke(this, null);
                    }
                }
            }
        }
    }
}
