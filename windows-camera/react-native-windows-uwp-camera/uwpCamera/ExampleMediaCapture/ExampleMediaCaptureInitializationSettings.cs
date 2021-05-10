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
using System.Text;
using System.Threading.Tasks;
using Windows.Media.Core;

namespace Examples.Media.Capture
{
    public enum ExampleMediaCaptureFaceDetectionAffinity
    {
        FrameReader,
        MediaCapturePreview,
    }

    public sealed class ExampleMediaCaptureInitializationSettings
    {
        public FaceDetectionMode FaceDetectionMode { get; set; } = FaceDetectionMode.HighPerformance;
        public TimeSpan? FrameCorrelationTimeSpan { get; set; } = null;
        public ExampleMediaCaptureFaceDetectionAffinity FaceDetectionAffinity { get; set; } = ExampleMediaCaptureFaceDetectionAffinity.FrameReader;
    }
}
