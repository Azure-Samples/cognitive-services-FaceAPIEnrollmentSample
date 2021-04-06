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

using Examples.Media.Capture;
using Examples.Media.Capture.FaceAnalysis;
using Examples.Media.Capture.Frames;
using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading.Tasks;
using System.Timers;
using Windows.Media.Capture.Frames;
using Windows.UI.Core;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Navigation;

namespace ExampleMediaCaptureUWP.Views
{
    /// <summary>
    /// Example of access control scenario
    /// </summary>
    public sealed partial class AccessControlPage : Page
    {
        private ConcurrentQueue<TimeSpan> ColorFrameEpochs { get; set; }
        private ConcurrentQueue<TimeSpan> IlluminatedInfraredFrameEpochs { get; set; }
        private ConcurrentQueue<TimeSpan> NonIlluminatedInfraredFrameEpochs { get; set; }
        private TimeSpan SystemRelativeTime { get; set; } = TimeSpan.Zero;

        private Timer FrameReaderStopTrigger { get; set; }
        private DispatcherTimer DispatcherTimer { get; set; }

        private ExampleMediaCapture MediaCapture { get; set; }
        private ExampleMediaFrameReader FrameReader { get; set; }
        private ExampleMediaFrameCollection FrameCollection { get; set; }

        private string ColorFps => GetFrameRate(ColorFrameEpochs).ToString("G4");
        private string IlluminatedInfraredFps => GetFrameRate(IlluminatedInfraredFrameEpochs).ToString("G4");
        private string NonIlluminatedInfraredFps => GetFrameRate(NonIlluminatedInfraredFrameEpochs).ToString("G4");
        private double PreviewOpacity { get; set; } = 0.0;

        private bool UseFaceDetection { get; set; } = false;
        private Visibility FaceDetectionDescriptionVisibility => UseFaceDetection ? Visibility.Visible : Visibility.Collapsed;
        private Visibility ManualToggleVisibility => UseFaceDetection ? Visibility.Collapsed : Visibility.Visible;

        public AccessControlPage()
        {
            this.InitializeComponent();
        }

        private double GetFrameRate(ConcurrentQueue<TimeSpan> epochs)
        {
            if (epochs.Count <= 1) return 0;
            return (epochs.Count - 1) / (SystemRelativeTime - epochs.Min()).TotalSeconds;
        }

        private void ExpireOneEpoch(ConcurrentQueue<TimeSpan> epochs)
        {
            if (epochs.TryPeek(out var peek) &&
                (SystemRelativeTime - peek > TimeSpan.FromSeconds(3)))
            {
                epochs.TryDequeue(out _);
            }
        }

        private void UpdateSystemRelativeTime(TimeSpan? systemRelativeTime)
        {
            if (systemRelativeTime == null) return;
            if (systemRelativeTime.Value > SystemRelativeTime)
            {
                SystemRelativeTime = systemRelativeTime.Value;
            }
        }

        private async Task StartOperationAsync()
        {
            ColorFrameEpochs = new ConcurrentQueue<TimeSpan>();
            IlluminatedInfraredFrameEpochs = new ConcurrentQueue<TimeSpan>();
            NonIlluminatedInfraredFrameEpochs = new ConcurrentQueue<TimeSpan>();

            // Open the capture object to pump the frames to UI preview element
            // More information, including how to keep the display on:
            // https://docs.microsoft.com/en-us/windows/uwp/audio-video-camera/simple-camera-preview-access
            // ExampleMediaCapture interface is based on Windows.Media.Capture.MediaCapture
            // https://docs.microsoft.com/en-us/uwp/api/Windows.Media.Capture.MediaCapture

            MediaCapture = new ExampleMediaCapture();
            await MediaCapture.InitializeAsync(new ExampleMediaCaptureInitializationSettings
            {
                FaceDetectionAffinity = ExampleMediaCaptureFaceDetectionAffinity.MediaCapturePreview,
            });

            FrameCollection = new ExampleMediaFrameCollection(MediaCapture);
            FrameCollection.CollectionProgressed += FrameCollection_CollectionProgressed;

            CaptureElement.Source = MediaCapture.PreviewMediaCapture;
            CaptureElement.FlowDirection = MediaCapture.PreviewFlowDirection;
            await MediaCapture.StartPreviewAsync();

            // Open the reader object to subscribe to arriving frames
            // More information:
            // https://docs.microsoft.com/en-us/windows/uwp/audio-video-camera/process-media-frames-with-mediaframereader#create-a-frame-reader-for-the-frame-source
            // ExampleMediaFrameReader interface is based on Windows.Media.Capture.Frames.MultiSourceMediaFrameReader
            // https://docs.microsoft.com/en-us/uwp/api/windows.media.capture.frames.multisourcemediaframereader

            FrameReader = await MediaCapture.CreateFrameReaderAsync();
            FrameReader.AcquisitionMode = MediaFrameReaderAcquisitionMode.Buffered;
            FrameReader.FrameArrived += FrameReader_FrameArrived;

            // Subscribe to face detection events
            // More information:
            // https://docs.microsoft.com/en-us/windows/uwp/audio-video-camera/scene-analysis-for-media-capture#face-detection-effect
            // ExampleMediaCapture.FaceDetected interface is based on Windows.Media.Core.FaceDetectionEffect.FaceDetected
            // https://docs.microsoft.com/en-us/uwp/api/windows.media.core.facedetectioneffect.facedetected

            if (UseFaceDetection)
            {
                MediaCapture.FaceDetected += MediaCapture_FaceDetected;
            }

            DispatcherTimer = new DispatcherTimer
            {
                Interval = TimeSpan.FromMilliseconds(100)
            };
            DispatcherTimer.Tick += DispatcherTimer_Tick;
            DispatcherTimer.Start();

            FrameReaderStopTrigger = new Timer
            {
                AutoReset = false,
                Interval = TimeSpan.FromSeconds(3).TotalMilliseconds,
            };
            FrameReaderStopTrigger.Elapsed += FrameReaderStopTrigger_Elapsed;

            if (!UseFaceDetection)
            {
                PreviewOpacity = 1.0;
            }
        }

        private async Task StopOperationAsync()
        {
            MediaCapture.FaceDetected -= MediaCapture_FaceDetected;
            FrameReader.FrameArrived -= FrameReader_FrameArrived;

            await Dispatcher.RunAsync(CoreDispatcherPriority.Normal, () =>
            {
                CaptureElement.Source = null;
            });

            await MediaCapture.StopPreviewAsync();

            await FrameReader.StopAsync();

            FrameCollection.Dispose();
            ColorFrameEpochs.Clear();
            IlluminatedInfraredFrameEpochs.Clear();
            NonIlluminatedInfraredFrameEpochs.Clear();

            await Dispatcher.RunAsync(CoreDispatcherPriority.Normal, DispatcherTimer.Stop);
            FrameReaderStopTrigger.Stop();
        }

        protected override async void OnNavigatedTo(NavigationEventArgs e)
        {
            await StartOperationAsync();

            base.OnNavigatedTo(e);
        }

        protected override async void OnNavigatingFrom(NavigatingCancelEventArgs e)
        {
            await StopOperationAsync();

            base.OnNavigatingFrom(e);
        }

        private void FrameCollection_CollectionProgressed(ExampleMediaFrameCollection sender, ExampleMediaFrameCollectionProgressedEventArgs args)
        {
            if (args.Frame.SourceKind == MediaFrameSourceKind.Color)
            {
                ColorFrameEpochs.Enqueue(args.Frame.SystemRelativeTime.Value);
                if (ColorFrameEpochs.Count > 10) ColorFrameEpochs.TryDequeue(out _);
            }
            else if (args.Frame.SourceKind == MediaFrameSourceKind.Infrared)
            {
                if (args.Frame.IsIlluminated == true)
                {
                    IlluminatedInfraredFrameEpochs.Enqueue(args.Frame.SystemRelativeTime.Value);
                    if (IlluminatedInfraredFrameEpochs.Count > 10) IlluminatedInfraredFrameEpochs.TryDequeue(out _);
                }
                else
                {
                    NonIlluminatedInfraredFrameEpochs.Enqueue(args.Frame.SystemRelativeTime.Value);
                    if (NonIlluminatedInfraredFrameEpochs.Count > 10) NonIlluminatedInfraredFrameEpochs.TryDequeue(out _);
                }
            }

            // Must either dispose or take ownership of the frame
            args.Frame.Dispose();
        }

        private void RawStats(MediaFrameReference frame)
        {
            if (frame == null) return;
            if (frame.SystemRelativeTime == null) return;

            if (frame.SourceKind == MediaFrameSourceKind.Color)
            {
                ColorFrameEpochs.Enqueue(frame.SystemRelativeTime.Value);
                if (ColorFrameEpochs.Count > 10) ColorFrameEpochs.TryDequeue(out _);
            }
            else if (frame.SourceKind == MediaFrameSourceKind.Infrared &&
                     frame.VideoMediaFrame != null &&
                     frame.VideoMediaFrame.InfraredMediaFrame != null)
            {
                if (frame.VideoMediaFrame.InfraredMediaFrame.IsIlluminated == true)
                {
                    IlluminatedInfraredFrameEpochs.Enqueue(frame.SystemRelativeTime.Value);
                    if (IlluminatedInfraredFrameEpochs.Count > 10) IlluminatedInfraredFrameEpochs.TryDequeue(out _);
                }
                else
                {
                    NonIlluminatedInfraredFrameEpochs.Enqueue(frame.SystemRelativeTime.Value);
                    if (NonIlluminatedInfraredFrameEpochs.Count > 10) NonIlluminatedInfraredFrameEpochs.TryDequeue(out _);
                }
            }
        }

        private void FrameReader_FrameArrived(ExampleMediaFrameReader sender, ExampleMediaFrameArrivedEventArgs args)
        {
            try
            {
                // Access the latest frame
                // More information:
                // https://docs.microsoft.com/en-us/windows/uwp/audio-video-camera/process-media-frames-with-mediaframereader#handle-the-frame-arrived-event
                // ExampleMediaFrameReference interface is based on Windows.Media.Core.FaceDetectionEffect.FaceDetected
                // https://docs.microsoft.com/en-us/uwp/api/windows.media.capture.frames.multisourcemediaframereference

                using (var mediaFrameReference = sender.TryAcquireLatestFrameBySourceKind(args.SourceKind))
                {
                    // FrameCollection.Add(mediaFrameReference);
                    RawStats(mediaFrameReference);
                    UpdateSystemRelativeTime(mediaFrameReference?.SystemRelativeTime);
                }
            }
            catch (ObjectDisposedException) { }
            finally
            {
            }
        }

        private async void MediaCapture_FaceDetected(ExampleMediaCapture sender, FaceDetectedEventArgs args)
        {
            // This event is raised even when no faces are present, the argument must be inspected

            if (args.ResultFrame.DetectedFaces.Any() && FrameReader != null)
            {
                if (PreviewOpacity == 0.0)
                {
                    await FrameReader.StartAsync();
                    PreviewOpacity = 1.0;
                }

                // Reset the countdown to turning off camera
                FrameReaderStopTrigger.Stop();
                FrameReaderStopTrigger.Start();
            }

            UpdateSystemRelativeTime(args.ResultFrame.SystemRelativeTime);
        }

        private void DispatcherTimer_Tick(object sender, object e)
        {
            Bindings.Update();

            ExpireOneEpoch(ColorFrameEpochs);
            ExpireOneEpoch(IlluminatedInfraredFrameEpochs);
            ExpireOneEpoch(NonIlluminatedInfraredFrameEpochs);
        }

        private async void FrameReaderStopTrigger_Elapsed(object sender, ElapsedEventArgs e)
        {
            await FrameReader.StopAsync();
            PreviewOpacity = 0.0;
        }

        private async void ToggleSwitch_Toggled(object sender, RoutedEventArgs e)
        {
            if (sender is ToggleSwitch @switch)
            {
                if (@switch.IsOn)
                {
                    await FrameReader.StartAsync();
                }
                else
                {
                    await FrameReader.StopAsync();
                }
            }
        }
    }
}
