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
using Examples.Media.Capture.Frames;
using Examples.Media.Capture.Utilities;
using System;
using System.Collections.Concurrent;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Reactive.Concurrency;
using System.Reactive.Linq;
using System.Reactive.Threading.Tasks;
using System.Runtime.Serialization.Json;
using System.Threading.Tasks;
using Windows.Graphics.Imaging;
using Windows.Media.Capture.Frames;
using Windows.Media.Devices;
using Windows.Storage;
using Windows.Storage.Streams;
using Windows.System;
using Windows.UI.Core;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Navigation;

namespace ExampleMediaCaptureUWP.Views
{
    /// <summary>
    /// Example of data collection scenario
    /// </summary>
    public sealed partial class DataCollectPage : Page
    {
        // Example properties to support business logic:
        // Important read-only counts and properties for data collection and UI

        private int MinColorCount { get; } = 100;
        private int MinIlluminatedInfraredCount { get; } = 50;
        private int MinAggregateInfraredCount { get; } = 100;
        private int CollectedAggregateInfraredFramesCount => CollectedNonIlluminatedInfraredFrames.Count + CollectedIlluminatedInfraredFrames.Count;
        private int CollectedAggregateFramesCount => CollectedColorFrames.Count + CollectedAggregateInfraredFramesCount;
        private bool IsCollectionCompleted => CollectedColorFrames.Count > MinColorCount &&
                                              CollectedIlluminatedInfraredFrames.Count > MinIlluminatedInfraredCount &&
                                              CollectedIlluminatedInfraredFrames.Count + CollectedNonIlluminatedInfraredFrames.Count > MinAggregateInfraredCount;

        // Example properties to support business logic:
        // Auxiliary properties for UI
        private int WrittenToDiskFramesCount { get; set; }


        // Example properties to support business logic:
        // Containers for the collected frames

        private ConcurrentBag<ExampleMediaFrame> CollectedColorFrames { get; set; }
        private ConcurrentBag<ExampleMediaFrame> CollectedNonIlluminatedInfraredFrames { get; set; }
        private ConcurrentBag<ExampleMediaFrame> CollectedIlluminatedInfraredFrames { get; set; }

        private ExampleMediaCapture MediaCapture { get; set; }
        private ExampleMediaFrameReader FrameReader { get; set; }
        private ExampleMediaFrameCollection FrameCollection { get; set; }

        // Monitors elapsed time since operation start
        private Stopwatch Stopwatch { get; set; }

        // Triggers UI updates at fixed interval
        private DispatcherTimer DispatcherTimer { get; set; }

        private StorageFolder WorkingFolder => ApplicationData.Current.LocalFolder;


        public DataCollectPage()
        {
            this.InitializeComponent();
        }

        private async Task StartOperationAsync()
        {
            CollectedColorFrames = new ConcurrentBag<ExampleMediaFrame>();
            CollectedNonIlluminatedInfraredFrames = new ConcurrentBag<ExampleMediaFrame>();
            CollectedIlluminatedInfraredFrames = new ConcurrentBag<ExampleMediaFrame>();
            Stopwatch = new Stopwatch();
            WrittenToDiskFramesCount = 0;

            // Open the capture object to pump the frames to UI preview element
            // More information, including how to keep the display on:
            // https://docs.microsoft.com/en-us/windows/uwp/audio-video-camera/simple-camera-preview-access
            // ExampleMediaCapture interface is based on Windows.Media.Capture.MediaCapture
            // https://docs.microsoft.com/en-us/uwp/api/Windows.Media.Capture.MediaCapture

            MediaCapture = new ExampleMediaCapture();
            await MediaCapture.InitializeAsync();

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

            // Start frame reader immediately

            await FrameReader.StartAsync();

            DispatcherTimer = new DispatcherTimer
            {
                Interval = TimeSpan.FromMilliseconds(100)
            };
            DispatcherTimer.Tick += DispatcherTimer_Tick;
            DispatcherTimer.Start();
            Stopwatch.Start();
        }

        private async Task StopOperationAsync()
        {
            Stopwatch.Stop();
            await Dispatcher.RunAsync(CoreDispatcherPriority.Normal, () =>
            {
                CaptureElement.Source = null;
            });

            FrameReader.FrameArrived -= FrameReader_FrameArrived;

            try
            {
                await MediaCapture.StopPreviewAsync();
            }
            catch (Exception e) when (e.HResult == unchecked((int)0xc00dabe4) &&
                                      MediaCapture.PreviewMediaCapture.CameraStreamState != CameraStreamState.Streaming)
            {
                // StopPreview is not idempotent, silence exception when camera is not streaming
            }

            await FrameReader.StopAsync();

            FrameCollection.Dispose();
            CollectedColorFrames.AsParallel().ForAll(frame => frame.Dispose());
            CollectedNonIlluminatedInfraredFrames.AsParallel().ForAll(frame => frame.Dispose());
            CollectedIlluminatedInfraredFrames.AsParallel().ForAll(frame => frame.Dispose());
            CollectedColorFrames.Clear();
            CollectedNonIlluminatedInfraredFrames.Clear();
            CollectedIlluminatedInfraredFrames.Clear();

            await Dispatcher.RunAsync(CoreDispatcherPriority.Normal, DispatcherTimer.Stop);
        }

        private async Task WriteToDiskAsync()
        {
            var diskWriteInputPackages = CollectedColorFrames.Concat(CollectedIlluminatedInfraredFrames).Concat(CollectedNonIlluminatedInfraredFrames)
                .AsParallel().Select(async frame =>
            {
                SoftwareBitmap compatibleBitmap = null;
                Action cleanupAction = () => { };
                if (frame.SoftwareBitmap.BitmapPixelFormat != BitmapPixelFormat.Bgra8 ||
                    frame.SoftwareBitmap.BitmapAlphaMode != BitmapAlphaMode.Ignore)
                {
                    compatibleBitmap = SoftwareBitmap.Convert(frame.SoftwareBitmap, BitmapPixelFormat.Bgra8, BitmapAlphaMode.Ignore);
                    cleanupAction = () => compatibleBitmap.Dispose();
                }
                else
                {
                    compatibleBitmap = frame.SoftwareBitmap;
                }

                var fileName = ((ulong)frame.SystemRelativeTime?.Ticks).ToString("D10");
                var encodingOptions = new BitmapPropertySet();
                var encoderId = Guid.Empty;

                if (frame.SourceKind == MediaFrameSourceKind.Color)
                {
                    fileName = "RGB-" + fileName + ".jpg";
                    encoderId = BitmapEncoder.JpegEncoderId;
                    encodingOptions.Add("ImageQuality", new BitmapTypedValue(
                        1.0, // Maximum quality
                        Windows.Foundation.PropertyType.Single));
                }
                else if (frame.SourceKind == MediaFrameSourceKind.Infrared)
                {
                    if (frame.IsIlluminated == true)
                    {
                        fileName = "IIR-" + fileName;  // Illuminated IR
                    }
                    else
                    {
                        fileName = "AIR-" + fileName;  // Ambient IR
                    }

                    fileName += ".png";
                    encoderId = BitmapEncoder.PngEncoderId;
                }

                var memoryStream = new InMemoryRandomAccessStream();
                BitmapEncoder encoder = await BitmapEncoder.CreateAsync(encoderId, memoryStream, encodingOptions);
                encoder.SetSoftwareBitmap(compatibleBitmap);
                await encoder.FlushAsync();
                return new { Stream = memoryStream.AsStream(), CleanupAction = cleanupAction, FileName = fileName };
            })
            .Select(task => task.ToObservable()).Merge().ObserveOn(NewThreadScheduler.Default).ToEnumerable();    // sequentialize awaitables

            var zipPath = Path.Combine(WorkingFolder.Path, "CollectedData.zip");
            using (FileStream zipFileStream = new FileStream(zipPath, FileMode.Create))
            {
                using (ZipArchive archive = new ZipArchive(zipFileStream, ZipArchiveMode.Create))
                {
                    foreach (var input in diskWriteInputPackages)
                    {
                        ZipArchiveEntry zipImgFileEntry = archive.CreateEntry(input.FileName, CompressionLevel.NoCompression);
                        using (Stream zipEntryStream = zipImgFileEntry.Open())
                        {
                            await input.Stream.CopyToAsync(zipEntryStream);
                        }

                        ++WrittenToDiskFramesCount;
                    }

                    ZipArchiveEntry zipMetadataFileEntry = archive.CreateEntry("info.json", CompressionLevel.NoCompression);
                    using (Stream zipEntryStream = zipMetadataFileEntry.Open())
                    {
                        MetadataWriter.WriteSerialization(zipEntryStream.AsOutputStream(), MediaCapture.Properties);
                    }
                }
            }

            foreach (var input in diskWriteInputPackages)
            {
                input.CleanupAction();
                input.Stream.Dispose();
            }
        }

        // https://docs.microsoft.com/en-us/uwp/api/windows.ui.xaml.controls.page.onnavigatedto
        protected override async void OnNavigatedTo(NavigationEventArgs e)
        {
            ProgressRing.IsActive = true;

            await StartOperationAsync();

            ProgressRing.IsActive = false;

            base.OnNavigatedTo(e);
        }

        // https://docs.microsoft.com/en-us/uwp/api/windows.ui.xaml.controls.page.onnavigatingfrom
        protected override async void OnNavigatingFrom(NavigatingCancelEventArgs e)
        {
            await StopOperationAsync();

            base.OnNavigatingFrom(e);
        }

        private async void FrameCollection_CollectionProgressed(ExampleMediaFrameCollection sender, ExampleMediaFrameCollectionProgressedEventArgs args)
        {
            if (IsCollectionCompleted)
            {
                // Discard extraneous frames

                args.Frame.Dispose();
                return;
            }

            if (args.Frame.SourceKind == MediaFrameSourceKind.Color)
            {
                CollectedColorFrames.Add(args.Frame);
            }
            else if (args.Frame.SourceKind == MediaFrameSourceKind.Infrared)
            {
                if (args.Frame.IsIlluminated == true)
                {
                    CollectedIlluminatedInfraredFrames.Add(args.Frame);
                }
                else
                {
                    CollectedNonIlluminatedInfraredFrames.Add(args.Frame);
                }
            }
            else
            {
                // Don't know how to handle, discard

                args.Frame.Dispose();
            }

            if (IsCollectionCompleted)
            {
                FrameCollection.CollectionProgressed -= FrameCollection_CollectionProgressed;
                await WriteToDiskAsync();
                await StopOperationAsync();
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
                    FrameCollection.Add(mediaFrameReference);
                }
            }
            catch (ObjectDisposedException) { }
            finally { }
        }

        private void DispatcherTimer_Tick(object sender, object e)
        {
            Bindings.Update();
        }

        private async void OpenCollectionFolderButton_Click(object sender, RoutedEventArgs e)
        {
            await Launcher.LaunchFolderAsync(WorkingFolder);
        }
    }
}
