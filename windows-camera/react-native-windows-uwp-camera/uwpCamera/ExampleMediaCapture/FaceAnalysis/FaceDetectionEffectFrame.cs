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
using System.Linq;
using Windows.Foundation.Collections;
using Windows.Media;
using Windows.Media.FaceAnalysis;

namespace Examples.Media.Capture.FaceAnalysis
{
    public sealed class FaceDetectionEffectFrame : IMediaFrame, IDisposable
    {
        public void Dispose()
        {

        }

        internal FaceDetectionEffectFrame(Windows.Media.Core.FaceDetectionEffectFrame frame)
        {
            Source = frame;
        }

        internal FaceDetectionEffectFrame(VideoFrame frame, IList<DetectedFace> detectedFaces)
        {
            Source = frame;
            DetectedFacesSource = detectedFaces.ToList();
        }

        public IReadOnlyList<DetectedFace> DetectedFaces => DetectedFacesSource ?? (Source as Windows.Media.Core.FaceDetectionEffectFrame).DetectedFaces;
        public TimeSpan? SystemRelativeTime
        {
            get => MediaFrame.SystemRelativeTime;
            set
            {
                MediaFrame.SystemRelativeTime = value;
            }
        }
        public TimeSpan? RelativeTime
        {
            get => MediaFrame.RelativeTime;
            set
            {
                MediaFrame.RelativeTime = value;
            }
        }
        public bool IsDiscontinuous
        {
            get => MediaFrame.IsDiscontinuous;
            set
            {
                MediaFrame.IsDiscontinuous = value;
            }
        }
        public TimeSpan? Duration
        {
            get => MediaFrame.Duration;
            set
            {
                MediaFrame.Duration = value;
            }
        }
        public IPropertySet ExtendedProperties => MediaFrame.ExtendedProperties;
        public bool IsReadOnly => MediaFrame.IsReadOnly;
        public string Type => MediaFrame.Type;

        private object Source { get; }
        private List<DetectedFace> DetectedFacesSource { get; }
        private IMediaFrame MediaFrame => Source as IMediaFrame;

    }
}
