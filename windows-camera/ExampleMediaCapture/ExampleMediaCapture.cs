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

using Examples.Media.Capture.Frames;
using Examples.Media.Capture.Internal;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Windows.ApplicationModel;
using Windows.Devices.Enumeration;
using Windows.Foundation;
using Windows.Foundation.Collections;
using Windows.Media.Capture;
using Windows.Media.Capture.Frames;
using Windows.Media.Core;
using Windows.Media.Devices;
using Windows.Media.MediaProperties;
using Windows.Security.ExchangeActiveSyncProvisioning;
using Windows.System.Profile;
using Windows.UI.Xaml;

namespace Examples.Media.Capture
{
    public sealed class ExampleMediaCapture
    {
        public AudioDeviceController AudioDeviceController => ExclusiveMediaCapture.AudioDeviceController;
        public CameraStreamState CameraStreamState => ExclusiveMediaCapture.CameraStreamState;
        public IReadOnlyDictionary<string, MediaFrameSource> FrameSources => ExclusiveMediaCapture.FrameSources;
        public MediaCaptureSettings MediaCaptureSettings => ExclusiveMediaCapture.MediaCaptureSettings;
        public MediaCaptureThermalStatus ThermalStatus => ExclusiveMediaCapture.ThermalStatus;
        public VideoDeviceController VideoDeviceController => ExclusiveMediaCapture.VideoDeviceController;
        public MediaCapture PreviewMediaCapture => FallbackMediaCapture ?? ExclusiveMediaCapture;
        public FlowDirection PreviewFlowDirection => ExclusiveRgbSourceInfo.DeviceInformation?.EnclosureLocation?.Panel == Panel.Front ? FlowDirection.RightToLeft : FlowDirection.LeftToRight;
        public IPropertySet Properties { get; private set; }

        public ExampleMediaCapture() { }

        public IAsyncAction InitializeAsync() => InitializeAsync_Impl().AsAsyncAction();
        public IAsyncAction InitializeAsync(ExampleMediaCaptureInitializationSettings ExampleMediaCaptureInitializationSettings) => InitializeAsync_Impl(ExampleMediaCaptureInitializationSettings).AsAsyncAction();
        internal async Task InitializeAsync_Impl(ExampleMediaCaptureInitializationSettings ExampleMediaCaptureInitializationSettings = null)
        {
            InitializationSettings = ExampleMediaCaptureInitializationSettings ?? new ExampleMediaCaptureInitializationSettings();

            await SelectExclusiveSourceGroupAsync();

            if (UseFallbackSourceGroup)
            {
                await SelectFallbackSourceGroupAsync();
            }

            await InitializeExclusiveMediaCaptureAsync();

            if (UseFallbackSourceGroup)
            {
                await InitializeFallbackMediaCaptureAsync();
            }

            await SetMediaFormatAsync();

            if (InitializationSettings.FaceDetectionAffinity == ExampleMediaCaptureFaceDetectionAffinity.MediaCapturePreview)
            {
                await EnablePreviewFaceDetectionAsync(InitializationSettings.FaceDetectionMode);
            }

            PopulateProperties();
        }

        public IAsyncOperation<ExampleMediaFrameReader> CreateFrameReaderAsync() => CreateFrameReaderAsync_Impl().AsAsyncOperation();
        internal async Task<ExampleMediaFrameReader> CreateFrameReaderAsync_Impl()
        {
            MediaFrameReader faceDetectionFrameReader = null;
            if (InitializationSettings.FaceDetectionAffinity == ExampleMediaCaptureFaceDetectionAffinity.FrameReader)
            {
                faceDetectionFrameReader = await PreviewMediaCapture.CreateFrameReaderAsync(PreviewMediaCapture.FrameSources[ExclusiveRgbSourceInfo.Id]);
            }

            var frameReader = new ExampleMediaFrameReader(
                new Dictionary<MediaFrameSourceKind, MediaFrameReader> {
#if USE_INFRARED
                    { MediaFrameSourceKind.Infrared, await ExclusiveMediaCapture.CreateFrameReaderAsync(FrameSources[ExclusiveIrSourceInfo.Id]) },
#else
                    { MediaFrameSourceKind.Infrared, await PreviewMediaCapture.CreateFrameReaderAsync(PreviewMediaCapture.FrameSources[ExclusiveRgbSourceInfo.Id]) },
#endif
                    { MediaFrameSourceKind.Color, await PreviewMediaCapture.CreateFrameReaderAsync(PreviewMediaCapture.FrameSources[ExclusiveRgbSourceInfo.Id]) },
                },
                faceDetectionFrameReader,
                PreviewFaceDetectionEffect,
                InitializationSettings.FrameCorrelationTimeSpan);
            frameReader.FaceDetected += FrameReader_FaceDetected;
            return frameReader;
        }

        public IAsyncAction StartPreviewAsync() => StartPreviewAsync_Impl().AsAsyncAction();
        internal async Task StartPreviewAsync_Impl()
        {
            await PreviewMediaCapture.StartPreviewAsync();
        }

        public IAsyncAction StopPreviewAsync() => StopPreviewAsync_Impl().AsAsyncAction();
        internal async Task StopPreviewAsync_Impl()
        {
            await PreviewMediaCapture.StopPreviewAsync();
        }

        public event TypedEventHandler<MediaCapture, object> CameraStreamStateChanged;
        public event TypedEventHandler<MediaCapture, MediaCaptureDeviceExclusiveControlStatusChangedEventArgs> CaptureDeviceExclusiveControlStatusChanged;
        public event MediaCaptureFailedEventHandler Failed;
        public event TypedEventHandler<MediaCapture, MediaCaptureFocusChangedEventArgs> FocusChanged;
        public event TypedEventHandler<MediaCapture, PhotoConfirmationCapturedEventArgs> PhotoConfirmationCaptured;
        public event RecordLimitationExceededEventHandler RecordLimitationExceeded;
        public event TypedEventHandler<MediaCapture, object> ThermalStatusChanged;

        public event TypedEventHandler<ExampleMediaCapture, FaceAnalysis.FaceDetectedEventArgs> FaceDetected;

#if USE_INFRARED
        internal EnclosureLocation InfraredEnclosureLocation = null;
        internal EnclosureLocation ColorEnclosureLocation = null;
        private DefaultDictionary<string, EnclosureLocation> EnclosureLocations { get; set; } = new DefaultDictionary<string, EnclosureLocation>();
#endif
        private ExampleMediaCaptureInitializationSettings InitializationSettings { get; set; } = null;
        private MediaCapture ExclusiveMediaCapture { get; set; } = null;
        private MediaFrameSourceGroup ExclusiveSourceGroup { get; set; } = null;
        private MediaFrameSourceInfo ExclusiveRgbSourceInfo { get; set; } = null;
        private MediaFrameSourceInfo ExclusiveIrSourceInfo { get; set; } = null;
        private ulong ExclusiveIrCapability { get; set; } = 0u;
        private byte ExclusiveSourceGroupScore { get; set; } = 0;

        private bool UseFallbackSourceGroup { get; set; } = false;
        private MediaCapture FallbackMediaCapture { get; set; } = null;
        private MediaFrameSourceGroup FallbackSourceGroup { get; set; } = null;

        private bool RegionOfInterestCapable { get; set; } = false;
        private bool HardwareFaceDetectionEnabled { get; set; } = false;
        private bool? AlternativeFrameIllumination { get; set; } = false;

        private FaceDetectionEffect PreviewFaceDetectionEffect { get; set; } = null;

#if USE_INFRARED

        private RegionOfInterestController RegionOfInterestController { get; } = new RegionOfInterestController();

        private static byte GetSourceGroupScore(DefaultDictionary<MediaFrameSourceKind, Dictionary<MediaStreamType, MediaFrameSourceInfo>> sourceInfos)
        {
            byte score = 0;                                                                         // The preferences, in decreasing order of importance:
            if (sourceInfos[MediaFrameSourceKind.Infrared].Any()) score               += 0b1000;    // - Has IR stream
            if (sourceInfos[MediaFrameSourceKind.Color].Any()) score                  += 0b0100;    // - Has Color stream
            if (sourceInfos[MediaFrameSourceKind.Infrared].Keys
                .Intersect(sourceInfos[MediaFrameSourceKind.Color].Keys).Any()) score += 0b0010;    // - Has matching IR + Color video stream type
            if (sourceInfos[MediaFrameSourceKind.Infrared]
                .ContainsKey(MediaStreamType.VideoPreview)) score                     += 0b0001;    // - Has IR preview stream
            return score;
        }
#endif

        private async Task SelectExclusiveSourceGroupAsync()
        {
#if USE_INFRARED
            var devices = await DeviceInformation.FindAllAsync(MediaFrameSourceGroup.GetDeviceSelector());

            foreach (var deviceInformation in devices)
            {
                var sourceGroup = await MediaFrameSourceGroup.FromIdAsync(deviceInformation.Id);

                var current = new DefaultDictionary<MediaFrameSourceKind, Dictionary<MediaStreamType, MediaFrameSourceInfo>>();
                ulong currentIrCapability = 0u;

                foreach (var sourceInfo in sourceGroup.SourceInfos)
                {
                    var originSourceGroupId = sourceInfo.Id.Split('@').ElementAtOrDefault(1) ?? sourceInfo.Id;

                    EnclosureLocations[originSourceGroupId] = EnclosureLocations[originSourceGroupId] ?? deviceInformation.EnclosureLocation;

                    if (sourceInfo.MediaStreamType != MediaStreamType.VideoPreview &&
                        sourceInfo.MediaStreamType != MediaStreamType.VideoRecord)
                    {
                        continue;
                    }

                    switch (sourceInfo.SourceKind)
                    {
                        case MediaFrameSourceKind.Color:
                            current[sourceInfo.SourceKind][sourceInfo.MediaStreamType] = sourceInfo;
                            break;
                        case MediaFrameSourceKind.Infrared:
                            if (sourceInfo.Properties.TryGetValue(MF._DEVICESTREAM_ATTRIBUTE_FACEAUTH_CAPABILITY, out var capability))
                            {
                                if (capability is ulong ulCapability &&
                                    (ulCapability & (
                                        KS.CAMERA_EXTENDEDPROP_FACEAUTH_MODE_ALTERNATIVE_FRAME_ILLUMINATION |
                                        KS.CAMERA_EXTENDEDPROP_FACEAUTH_MODE_BACKGROUND_SUBTRACTION)) != 0)
                                {
                                    currentIrCapability = ulCapability;
                                    current[sourceInfo.SourceKind][sourceInfo.MediaStreamType] = sourceInfo;
                                }
                            }
                            break;
                    }
                }

                if (current[MediaFrameSourceKind.Infrared].Any())
                {
                    var score = GetSourceGroupScore(current);
                    if (score <= ExclusiveSourceGroupScore) continue;

                    var preferredMediaStreamType = current[MediaFrameSourceKind.Infrared].Keys
                        .Intersect(current[MediaFrameSourceKind.Color].Keys)
                        .DefaultIfEmpty(MediaStreamType.VideoPreview)
                        .OrderByDescending(mediaStreamType => mediaStreamType == MediaStreamType.VideoPreview)
                        .First();

                    ExclusiveIrSourceInfo = current[MediaFrameSourceKind.Infrared].OrderByDescending(kvp => kvp.Key == preferredMediaStreamType).First().Value;
                    ExclusiveRgbSourceInfo = current[MediaFrameSourceKind.Color].OrderByDescending(kvp => kvp.Key == ExclusiveIrSourceInfo.MediaStreamType).Select(kvp => kvp.Value).FirstOrDefault();
                    ExclusiveSourceGroup = sourceGroup;
                    ExclusiveIrCapability = currentIrCapability;
                    ExclusiveSourceGroupScore = score;

                    if ((ExclusiveRgbSourceInfo != null) &&
                        deviceInformation.EnclosureLocation != null)
                    {
                        break;
                    }
                }
            }

            if (ExclusiveIrSourceInfo != null)
            {
                EnclosureLocations.TryGetValue(ExclusiveIrSourceInfo.Id.Split('@').ElementAtOrDefault(1) ?? ExclusiveIrSourceInfo.Id, out InfraredEnclosureLocation);
            }

            if (ExclusiveRgbSourceInfo != null)
            {
                EnclosureLocations.TryGetValue(ExclusiveRgbSourceInfo.Id.Split('@').ElementAtOrDefault(1) ?? ExclusiveRgbSourceInfo.Id, out ColorEnclosureLocation);
            }
#else
            var sourceGroups = await MediaFrameSourceGroup.FindAllAsync();
            if (sourceGroups.Any() && sourceGroups.First() is MediaFrameSourceGroup sourceGroup)
            {
                ExclusiveRgbSourceInfo = sourceGroup.SourceInfos.OrderByDescending(si => si.MediaStreamType == MediaStreamType.VideoPreview).First();
                ExclusiveSourceGroup = sourceGroup;
            }
#endif

            if (ExclusiveRgbSourceInfo == null)
            {
                UseFallbackSourceGroup = true;
            }
        }

        private async Task SelectFallbackSourceGroupAsync()
        {
#if USE_INFRARED
            var devices = await DeviceInformation.FindAllAsync(MediaFrameSourceGroup.GetDeviceSelector());

            foreach (var deviceInformation in devices)
            {
                var sourceGroup = await MediaFrameSourceGroup.FromIdAsync(deviceInformation.Id);
                var colorSourceInfos = sourceGroup.SourceInfos.Where(sourceInfo => sourceInfo.SourceKind == MediaFrameSourceKind.Color);
                var enclosureLocation = colorSourceInfos.Select(sourceInfo => sourceInfo?.DeviceInformation?.EnclosureLocation).FirstOrDefault(enclosure => enclosure != null);

                if (colorSourceInfos.Any() &&
                    enclosureLocation.Panel == InfraredEnclosureLocation.Panel)
                {
                    FallbackSourceGroup = sourceGroup;
                    ExclusiveRgbSourceInfo = colorSourceInfos.OrderByDescending(sourceInfo => sourceInfo?.MediaStreamType == ExclusiveIrSourceInfo.MediaStreamType).First();
                    ColorEnclosureLocation = enclosureLocation;
                    break;
                }
            }
#else
            SharedSourceInfo = ExclusiveRgbSourceInfo;
            SharedSourceGroup = ExclusiveSourceGroup;
#endif
        }

#if USE_INFRARED
        private async Task SetFaceModeAsync(MediaCapture mediaCapture = null)
        {
            try
            {
                if (mediaCapture == null)
                {
                    mediaCapture = new MediaCapture();
                    mediaCapture.Failed += MediaCapture_Failed;
                    var initializeCancellationToken = new CancellationTokenSource();

                    await mediaCapture.InitializeAsync(new MediaCaptureInitializationSettings()
                    {
                        MemoryPreference = MediaCaptureMemoryPreference.Cpu,
                        SharingMode = MediaCaptureSharingMode.ExclusiveControl,
                        SourceGroup = ExclusiveSourceGroup,
                        StreamingCaptureMode = StreamingCaptureMode.Video
                    });

                    mediaCapture.CameraStreamStateChanged += MediaCapture_CameraStreamStateChanged;
                    mediaCapture.CaptureDeviceExclusiveControlStatusChanged += MediaCapture_CaptureDeviceExclusiveControlStatusChanged;
                }

                var irFrameSource = mediaCapture.FrameSources[ExclusiveIrSourceInfo.Id];

                var irPropertyGet = await irFrameSource.Controller.GetPropertyAsync(KS.PROPERTY_CAMERACONTROL_EXTENDED_FACEAUTH_MODE);

                if (irPropertyGet.Status == MediaFrameSourceGetPropertyStatus.Success &&
                    irPropertyGet.Value is byte[])
                {
                    var irProperty = KSCAMERA_EXTENDEDPROP.FromBytes(irPropertyGet.Value as byte[], 0);
                    UInt64 flags = 0u;

                    if ((irProperty.Header.Capability & KS.CAMERA_EXTENDEDPROP_FACEAUTH_MODE_ALTERNATIVE_FRAME_ILLUMINATION) != 0)
                    {
                        flags = KS.CAMERA_EXTENDEDPROP_FACEAUTH_MODE_ALTERNATIVE_FRAME_ILLUMINATION;
                    }
                    else if ((irProperty.Header.Capability & KS.CAMERA_EXTENDEDPROP_FACEAUTH_MODE_BACKGROUND_SUBTRACTION) != 0)
                    {
                        flags = KS.CAMERA_EXTENDEDPROP_FACEAUTH_MODE_BACKGROUND_SUBTRACTION;
                    }

                    if (flags != irProperty.Header.Flags)
                    {
                        irProperty.Header.Flags = flags;
                        var newProperty = irProperty.GetBytes();
                        var irPropertySet = await irFrameSource.Controller.SetPropertyAsync(KS.PROPERTY_CAMERACONTROL_EXTENDED_FACEAUTH_MODE, newProperty);

                        if (irPropertySet == MediaFrameSourceSetPropertyStatus.Success)
                        {
                            if (flags == KS.CAMERA_EXTENDEDPROP_FACEAUTH_MODE_ALTERNATIVE_FRAME_ILLUMINATION)
                            {
                                AlternativeFrameIllumination = true;
                            }
                            else if (flags == KS.CAMERA_EXTENDEDPROP_FACEAUTH_MODE_BACKGROUND_SUBTRACTION)
                            {
                                AlternativeFrameIllumination = false;
                            }
                        }
                    }
                    else
                    {
                        if (flags == KS.CAMERA_EXTENDEDPROP_FACEAUTH_MODE_ALTERNATIVE_FRAME_ILLUMINATION)
                        {
                            AlternativeFrameIllumination = true;
                        }
                        else if (flags == KS.CAMERA_EXTENDEDPROP_FACEAUTH_MODE_BACKGROUND_SUBTRACTION)
                        {
                            AlternativeFrameIllumination = false;
                        }
                    }
                }
            }
            finally
            {   // TODO face mode will throw if the camera is already in face mode

            }
        }

        private async Task SetHardwareFaceDetectionAsync(MediaCapture mediaCapture = null, bool enable = true)
        {
            try
            {
                if (mediaCapture == null)
                {
                    mediaCapture = new MediaCapture();
                    mediaCapture.Failed += MediaCapture_Failed;
                    var initializeCancellationToken = new CancellationTokenSource();

                    await mediaCapture.InitializeAsync(new MediaCaptureInitializationSettings()
                    {
                        MemoryPreference = MediaCaptureMemoryPreference.Cpu,
                        SharingMode = MediaCaptureSharingMode.ExclusiveControl,
                        SourceGroup = ExclusiveSourceGroup,
                        StreamingCaptureMode = StreamingCaptureMode.Video
                    });

                    mediaCapture.CameraStreamStateChanged += MediaCapture_CameraStreamStateChanged;
                    mediaCapture.CaptureDeviceExclusiveControlStatusChanged += MediaCapture_CaptureDeviceExclusiveControlStatusChanged;
                }

                var irFrameSource = mediaCapture.FrameSources[ExclusiveIrSourceInfo.Id];

                var irPropertyGet = await irFrameSource.Controller.GetPropertyAsync(KS.PROPERTY_CAMERACONTROL_EXTENDED_FACEDETECTION);

                if (irPropertyGet.Status == MediaFrameSourceGetPropertyStatus.Success &&
                    irPropertyGet.Value is byte[])
                {
                    const bool SetFaceDetectionOn = true;
                    if (SetFaceDetectionOn)
                    {
                        var irProperty = KSCAMERA_EXTENDEDPROP.FromBytes(irPropertyGet.Value as byte[], 0);
                        UInt64 flags = 0u;

                        if (!enable)
                        {
                            flags = KS.CAMERA_EXTENDEDPROP_FACEDETECTION_OFF;
                        }
                        else if ((ExclusiveIrSourceInfo.MediaStreamType == MediaStreamType.VideoPreview) &&
                            ((irProperty.Header.Capability & KS.CAMERA_EXTENDEDPROP_FACEDETECTION_PREVIEW) != 0))
                        {
                            flags = KS.CAMERA_EXTENDEDPROP_FACEDETECTION_PREVIEW;
                        }
                        else if ((ExclusiveIrSourceInfo.MediaStreamType == MediaStreamType.VideoRecord) &&
                            ((irProperty.Header.Capability & KS.CAMERA_EXTENDEDPROP_FACEDETECTION_VIDEO) != 0))
                        {
                            flags = KS.CAMERA_EXTENDEDPROP_FACEDETECTION_VIDEO;
                        }

                        if (flags != irProperty.Header.Flags)
                        {
                            irProperty.Header.Flags = flags;
                            var newProperty = irProperty.GetBytes();
                            var irPropertySet = await irFrameSource.Controller.SetPropertyAsync(KS.PROPERTY_CAMERACONTROL_EXTENDED_FACEDETECTION, newProperty);

                            if (irPropertySet == MediaFrameSourceSetPropertyStatus.Success)
                            {
                                HardwareFaceDetectionEnabled = enable;
                            }
                            else
                            {
                                // SetHardwareFaceDetectionAsync.Set.Failed
                            }
                        }
                        else
                        {
                            HardwareFaceDetectionEnabled = enable;
                        }
                    }
                    else
                    {
                        HardwareFaceDetectionEnabled = enable;
                    }
                }
                else
                {
                    // SetHardwareFaceDetectionAsync.Get.Failed
                }
            }
            finally
            {   // TODO hardware face detection will throw if already activated
            }
        }
#endif

        private async Task InitializeExclusiveMediaCaptureAsync()
        {
            var retry = true;
            var useExclusiveControl = true;

            while (retry)
            {
#if USE_INFRARED
                RegionOfInterestController.Stop();
#endif

                retry = false;
                try
                {
                    ExclusiveMediaCapture = new MediaCapture();
                    ExclusiveMediaCapture.CameraStreamStateChanged += MediaCapture_CameraStreamStateChanged;
                    ExclusiveMediaCapture.Failed += MediaCapture_Failed;
                    ExclusiveMediaCapture.RecordLimitationExceeded += MediaCapture_RecordLimitationExceeded;

                    await ExclusiveMediaCapture.InitializeAsync(new MediaCaptureInitializationSettings()
                    {
                        MemoryPreference = MediaCaptureMemoryPreference.Cpu,
                        SharingMode = useExclusiveControl ? MediaCaptureSharingMode.ExclusiveControl : MediaCaptureSharingMode.SharedReadOnly,
                        SourceGroup = ExclusiveSourceGroup,
                        StreamingCaptureMode = StreamingCaptureMode.Video,
                    });

                    ExclusiveMediaCapture.CaptureDeviceExclusiveControlStatusChanged += MediaCapture_CaptureDeviceExclusiveControlStatusChanged;
                    ExclusiveMediaCapture.FocusChanged += MediaCapture_FocusChanged;
                    ExclusiveMediaCapture.PhotoConfirmationCaptured += MediaCapture_PhotoConfirmationCaptured;
                    ExclusiveMediaCapture.ThermalStatusChanged += MediaCapture_ThermalStatusChanged;

#if USE_INFRARED
                    if (useExclusiveControl)
                    {
                        await SetFaceModeAsync(ExclusiveMediaCapture);
                    }
                    else
                    {
                        await SetFaceModeAsync();
                    }

                    var regionsOfInterestControl = FrameSources[ExclusiveIrSourceInfo.Id].Controller.VideoDeviceController.RegionsOfInterestControl;

                    if (regionsOfInterestControl != null)
                    {
                        if (regionsOfInterestControl.MaxRegions > 0)
                        {
                            RegionOfInterestCapable = true;
                        }
                    }

                    if (RegionOfInterestCapable)
                    {
                        if (useExclusiveControl)
                        {
                            await SetHardwareFaceDetectionAsync(ExclusiveMediaCapture);
                        }
                        else
                        {
                            await SetHardwareFaceDetectionAsync();
                        }

                        if (!HardwareFaceDetectionEnabled)
                        {
                            if (!useExclusiveControl)
                            {
                                throw new UnauthorizedAccessException("RequireExclusiveControl");
                            }

                            RegionOfInterestController.Start(regionsOfInterestControl);
                        }
                    }
#endif
                }
                catch (Exception e) when (unchecked((uint)e.HResult).Equals(0xc00d3e85))    // MF_E_SHUTDOWN
                {
                    ExclusiveMediaCapture.Dispose();

                    retry = true;
                    // Retrying (probably waited on UI modal for too long)
                }
#if USE_INFRARED
                catch (Exception e) when
                    ((e is KeyNotFoundException && !useExclusiveControl) ||
                     (e is UnauthorizedAccessException && e.Message.Equals("RequireExclusiveControl")))
                {
                    ExclusiveMediaCapture.Dispose();

                    useExclusiveControl = true;
                    retry = true;
                    // Retrying with exclusive control
                }
#endif
            }
        }

        private async Task InitializeFallbackMediaCaptureAsync()
        {
            FallbackMediaCapture = new MediaCapture();
            FallbackMediaCapture.CameraStreamStateChanged += MediaCapture_CameraStreamStateChanged;
            FallbackMediaCapture.Failed += MediaCapture_Failed;
            FallbackMediaCapture.RecordLimitationExceeded += MediaCapture_RecordLimitationExceeded;

            await FallbackMediaCapture.InitializeAsync(new MediaCaptureInitializationSettings()
            {
                MemoryPreference = MediaCaptureMemoryPreference.Cpu,
                SharingMode = MediaCaptureSharingMode.ExclusiveControl,
                SourceGroup = FallbackSourceGroup,
                StreamingCaptureMode = StreamingCaptureMode.Video,
            });

            FallbackMediaCapture.CaptureDeviceExclusiveControlStatusChanged += MediaCapture_CaptureDeviceExclusiveControlStatusChanged;
            FallbackMediaCapture.FocusChanged += MediaCapture_FocusChanged;
            FallbackMediaCapture.PhotoConfirmationCaptured += MediaCapture_PhotoConfirmationCaptured;
            FallbackMediaCapture.ThermalStatusChanged += MediaCapture_ThermalStatusChanged;
        }

        private double GetFrameRate(MediaRatio frameRate)
        {
            return frameRate.Numerator / frameRate.Denominator;
        }

        private double GetFormatBandwidth(MediaFrameFormat format)
        {
            double bandwidth = 1.0;
            bandwidth *= GetFrameRate(format.FrameRate);
            bandwidth *= format.VideoFormat.Width * format.VideoFormat.Height;
            return bandwidth;
        }

        private async Task SetMediaFormatAsync()
        {
            if (ExclusiveMediaCapture.FrameSources[ExclusiveIrSourceInfo.Id].SupportedFormats.Any())
            {
                var infraredFormat = ExclusiveMediaCapture.FrameSources[ExclusiveIrSourceInfo.Id].SupportedFormats
                   .Select(format => new KeyValuePair<double, MediaFrameFormat>(GetFormatBandwidth(format), format))
                   .OrderByDescending(format => GetFrameRate(format.Value.FrameRate))
                   .ThenByDescending(format => format.Key)
                   .First().Value;
                await ExclusiveMediaCapture.FrameSources[ExclusiveIrSourceInfo.Id].SetFormatAsync(infraredFormat);
            }

            if (PreviewMediaCapture.FrameSources[ExclusiveRgbSourceInfo.Id].SupportedFormats.Any())
            {
                var colorFormat = PreviewMediaCapture.FrameSources[ExclusiveRgbSourceInfo.Id].SupportedFormats
                   .Select(format => new KeyValuePair<double, MediaFrameFormat>(GetFormatBandwidth(format), format))
                   .OrderByDescending(format => GetFrameRate(format.Value.FrameRate))
                   .ThenByDescending(format => format.Key)
                   // .Reverse()
                   //.Where(format => GetFrameRate(format.Value.FrameRate) < 30)
                   // .Where(format => format.Key < 50_000_000)
                   .First().Value;
                await PreviewMediaCapture.FrameSources[ExclusiveRgbSourceInfo.Id].SetFormatAsync(colorFormat);
            }
        }

        private async Task EnablePreviewFaceDetectionAsync(FaceDetectionMode faceDetectionMode)
        {
            PreviewFaceDetectionEffect = await PreviewMediaCapture.AddVideoEffectAsync(new FaceDetectionEffectDefinition()
            {
                DetectionMode = faceDetectionMode,
                SynchronousDetectionEnabled = false,
            }, ExclusiveRgbSourceInfo.MediaStreamType) as FaceDetectionEffect;
            PreviewFaceDetectionEffect.FaceDetected += PreviewFaceDetectionEffect_FaceDetected;
        }

        private void PopulateProperties()
        {
            var deviceInfo = new EasClientDeviceInformation();
            ulong version = ulong.Parse(AnalyticsInfo.VersionInfo.DeviceFamilyVersion);
            Properties = new PropertySet
            {
                ["InfraredSensorName"] = ExclusiveIrSourceInfo?.DeviceInformation?.Name,
                ["InfraredSensorId"] = ExclusiveIrSourceInfo?.Id,
                ["InfraredSensorStreamType"] = ExclusiveIrSourceInfo?.MediaStreamType,
                ["InfraredBitmapPixelFormat"] = ExclusiveMediaCapture.FrameSources[ExclusiveIrSourceInfo.Id].CurrentFormat.Subtype,
                ["InfraredPanel"] = InfraredEnclosureLocation?.Panel,
                ["InfraredRotationCW"] = InfraredEnclosureLocation?.RotationAngleInDegreesClockwise,
                // ["InfraredIsMirrored"] = ExclusiveInfraredIsMirrored;
                ["InfraredRegionOfInterestCapable"] = RegionOfInterestCapable,
                ["InfraredHardwareFaceDetectionEnabled"] = HardwareFaceDetectionEnabled,
                ["InfraredAlternativeFrameIllumination"] = AlternativeFrameIllumination,
                ["ColorSensorName"] = ExclusiveRgbSourceInfo?.DeviceInformation?.Name,
                ["ColorSensorId"] = ExclusiveRgbSourceInfo?.Id,
                ["ColorSensorStreamType"] = ExclusiveRgbSourceInfo?.MediaStreamType,
                ["ColorBitmapPixelFormat"] = PreviewMediaCapture.FrameSources[ExclusiveRgbSourceInfo.Id].CurrentFormat.Subtype,
                ["ColorPanel"] = ColorEnclosureLocation?.Panel,
                ["ColorRotationCW"] = ColorEnclosureLocation?.RotationAngleInDegreesClockwise,
                // ["ColorIsMirrored"] = ExclusiveColorIsMirrored;
                ["SensorSourceGroupName"] = ExclusiveSourceGroup?.DisplayName,
                ["SensorSourceGroupId"] = ExclusiveSourceGroup?.Id,
                ["DeviceManufacturer"] = deviceInfo.SystemManufacturer,
                ["DeviceModel"] = deviceInfo.SystemProductName,
                ["OS"] = deviceInfo.OperatingSystem,
                ["OSArchitecture"] = Package.Current.Id.Architecture,
                ["OSVersion"] = new Version(
                    major:    (ushort)((version & 0xFFFF000000000000L) >> 48),
                    minor:    (ushort)((version & 0x0000FFFF00000000L) >> 32),
                    build:    (ushort)((version & 0x00000000FFFF0000L) >> 16),
                    revision: (ushort) (version & 0x000000000000FFFFL)
                ),
            };
        }

        private void MediaCapture_CameraStreamStateChanged(MediaCapture sender, object args)
        {
            CameraStreamStateChanged?.Invoke(sender, args);
        }

        private void MediaCapture_CaptureDeviceExclusiveControlStatusChanged(MediaCapture sender, MediaCaptureDeviceExclusiveControlStatusChangedEventArgs args)
        {
            CaptureDeviceExclusiveControlStatusChanged?.Invoke(sender, args);
        }

        private void MediaCapture_Failed(MediaCapture sender, MediaCaptureFailedEventArgs errorEventArgs)
        {
            Failed?.Invoke(sender, errorEventArgs);
        }

        private void MediaCapture_FocusChanged(MediaCapture sender, MediaCaptureFocusChangedEventArgs args)
        {
            FocusChanged?.Invoke(sender, args);
        }

        private void MediaCapture_PhotoConfirmationCaptured(MediaCapture sender, PhotoConfirmationCapturedEventArgs args)
        {
            PhotoConfirmationCaptured?.Invoke(sender, args);
        }

        private void MediaCapture_RecordLimitationExceeded(MediaCapture sender)
        {
            RecordLimitationExceeded?.Invoke(sender);
        }

        private void MediaCapture_ThermalStatusChanged(MediaCapture sender, object args)
        {
            ThermalStatusChanged?.Invoke(sender, args);
        }

        private void FrameReader_FaceDetected(ExampleMediaFrameReader sender, FaceAnalysis.FaceDetectedEventArgs args)
        {
            FaceDetected?.Invoke(this, args);
        }

        private void PreviewFaceDetectionEffect_FaceDetected(FaceDetectionEffect sender, FaceDetectedEventArgs args)
        {
            FaceDetected?.Invoke(this, new FaceAnalysis.FaceDetectedEventArgs(new FaceAnalysis.FaceDetectionEffectFrame(args.ResultFrame)));
        }
    }
}
