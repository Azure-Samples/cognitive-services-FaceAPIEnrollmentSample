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
using System.Diagnostics;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Windows.Foundation;
using Windows.Graphics.Imaging;
using Windows.Media.Devices;
using Windows.Media.FaceAnalysis;
using Windows.UI.Core;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace Examples.Media.Capture
{
#if USE_INFRARED

    class RegionOfInterestController
    {
        enum WorkerAction
        {
            Set,
            Clear,
            None,
        };

        volatile bool Activated = false;
        volatile bool Paused = true;
        volatile RegionsOfInterestControl RegionsOfInterestControl;
        volatile SoftwareBitmap Sample = null;

        Stopwatch Stopwatch;
        Task WorkerTask;
        object SampleLock = new object();
        BitmapPixelFormat? SupportedBitmapPixelFormat = null;
        bool IsRegionSet = false;
        TimeSpan SetEpoch = TimeSpan.Zero;

        readonly TimeSpan Timeout = TimeSpan.FromMilliseconds(2000.0 / 3.0);
        readonly TimeSpan Period = TimeSpan.FromMilliseconds(1000.0 / 60.0);
        readonly FaceDetector FaceDetector = FaceDetector.CreateAsync().AsTask().Result;

        internal ExampleMediaCapture ExampleMediaCapture { get; set; }

        internal Exception Exception { get; private set; } = null;

        internal bool UseNativeFallback = false;
        internal bool SetAllowed = true;
        internal bool InitialClearDone = false;

        internal bool Start(RegionsOfInterestControl regionsOfInterestControl)
        {
            if (Activated)
            {
                return false;
            }

            Activated = true;

            RegionsOfInterestControl = regionsOfInterestControl;
            Stopwatch = Stopwatch.StartNew();
            WorkerTask = Task.Run(Worker);

            return true;
        }

        internal void Stop()
        {
            Activated = false;
        }

        internal void Resume()
        {
            Paused = false;
        }

        internal void Pause()
        {
            Paused = true;
        }


        async Task Worker()
        {
            Exception = null;

            InitialClearDone = false;

            try
            {
                while (Activated)
                {
                    var action = WorkerAction.Set;

                    SoftwareBitmap input = null;
                    lock (SampleLock)
                    {
                        if (Sample != null)
                        {
                            if (SupportedBitmapPixelFormat == Sample.BitmapPixelFormat)
                            {
                                input = SoftwareBitmap.Copy(Sample);
                            }
                            else
                            {
                                input = SoftwareBitmap.Convert(Sample, SupportedBitmapPixelFormat.Value);
                            }
                        }
                        Sample = null;
                    }

                    if (Paused)
                    {
                        action = WorkerAction.None;
                        await Task.Delay(Timeout);
                    }
                    else
                    {
                        if (IsRegionSet && Stopwatch.Elapsed - SetEpoch > Timeout)
                        {
                            action = WorkerAction.Clear;
                        }
                        else if (input == null || !SetAllowed)
                        {
                            action = WorkerAction.None;
                        }

                        if (!InitialClearDone && input != null)
                        {
                            InitialClearDone = true;
                            action = WorkerAction.Clear;
                        }
                    }

                    switch (action)
                    {
                        case WorkerAction.Set:
                            await SetAsync(input);
                            break;
                        case WorkerAction.Clear:
                            try
                            {
                                await RegionsOfInterestControl.ClearRegionsAsync();
                                IsRegionSet = false;

                            }
                            catch (COMException e) when (e.HResult.Equals(unchecked((int)0x80070016)))     // ERROR_BAD_COMMAND
                            {
                                // TODO RegionOfInterest.Clear.Failed
                            }
                            break;
                        case WorkerAction.None:
                            break;
                        default:
                            throw new NotImplementedException();
                    }

                    // await Task.Delay(Period);
                    await Task.Yield();
                }
            }
            catch (Exception e)
            {
                Exception = e;
            }
            finally
            {
                // RegionOfInterest.Stop
            }

        }

        internal void SetSample(SoftwareBitmap input)
        {
            if (!Activated)
            {
                return;
            }

            if (Sample == null)
            {
                lock (SampleLock)
                {
                    if (!SupportedBitmapPixelFormat.HasValue)
                    {
                        if (FaceDetector.IsBitmapPixelFormatSupported(input.BitmapPixelFormat))
                        {
                            SupportedBitmapPixelFormat = input.BitmapPixelFormat;
                        }
                        else
                        {
                            SupportedBitmapPixelFormat = FaceDetector.GetSupportedBitmapPixelFormats().First();
                        }
                    }

                    Sample = SoftwareBitmap.Copy(input);
                }
            }
        }

        async Task SetAsync(SoftwareBitmap input)
        {
            BitmapBounds bounds = default;

            try
            {
                var faces = await FaceDetector.DetectFacesAsync(input);

                if (faces.Any())
                {
                    bounds = faces.First().FaceBox;
                    if (!IsRegionSet)
                    {
                        IsRegionSet = true;
                    }

                    var hOffset = (bounds.X + bounds.Width == input.PixelWidth) ? 1 : 0;
                    var vOffset = (bounds.Y + bounds.Height == input.PixelHeight) ? 1 : 0;

                    var rectBounds = new Rect(
                                Math.Max(bounds.X / (double)input.PixelWidth, float.Epsilon),
                                Math.Max(bounds.Y / (double)input.PixelHeight, float.Epsilon),
                                (bounds.Width - hOffset) / (double)input.PixelWidth,
                                (bounds.Height - vOffset) / (double)input.PixelHeight);

                    if ((ExampleMediaCapture.InfraredEnclosureLocation?.RotationAngleInDegreesClockwise ?? 0) != 0)
                    {
                        rectBounds = rectBounds.Rotate((int)ExampleMediaCapture.InfraredEnclosureLocation.RotationAngleInDegreesClockwise);
                    }

                    var region = new[] {
                        new RegionOfInterest()
                        {
                            AutoExposureEnabled = true,
                            Bounds = rectBounds,
                            BoundsNormalized = true,
                            Type = RegionOfInterestType.Face,
                            Weight = 100,
                        }
                    };

                    if (!Paused)
                    {
                        await RegionsOfInterestControl.SetRegionsAsync(region);
                        // Camera.FaceBox.Dispatcher.RunAsync(CoreDispatcherPriority.Normal, () =>
                        // {
                        //     Camera.FaceBox.Width = rectBounds.Width * Camera.FaceCanvas.Width;
                        //     Camera.FaceBox.Height = rectBounds.Height * Camera.FaceCanvas.Height;
                        //     Canvas.SetTop(Camera.FaceBox, rectBounds.Top * Camera.FaceCanvas.Height);
                        //     Canvas.SetLeft(Camera.FaceBox, rectBounds.Left * Camera.FaceCanvas.Width);
                        // });

                        SetEpoch = Stopwatch.Elapsed;
                    }
                }
            }
            catch (COMException e) when (e.HResult.Equals(unchecked((int)0x8000000b)))  // E_BOUNDS
            {
                // TODO RegionOfInterest.OutOfBounds
            }
            catch (Exception e) when (e.HResult.Equals(unchecked((int)0x80070016)))     // ERROR_BAD_COMMAND
            {
                // UseNativeFallback = true;
                // TODO RegionOfInterest.Set.Failed");
            }
            catch (Exception)
            {
                // TODO swallow
            }
        }
    }

#endif
}
