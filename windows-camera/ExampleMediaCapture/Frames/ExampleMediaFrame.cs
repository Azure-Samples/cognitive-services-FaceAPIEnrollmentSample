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
using Windows.Graphics.Imaging;
using Windows.Media.Capture.Frames;

namespace Examples.Media.Capture.Frames
{
    public sealed class ExampleMediaFrame : IDisposable
    {
        public bool? IsIlluminated { get; }
        public SoftwareBitmap SoftwareBitmap { get; }
        public MediaFrameSourceKind SourceKind { get; }
        public TimeSpan? SystemRelativeTime { get; }

        public void Dispose()
        {
            SoftwareBitmap.Dispose();
        }

        internal ExampleMediaFrame(VideoMediaFrame frame)
        {
            IsIlluminated = frame.InfraredMediaFrame?.IsIlluminated;
            SourceKind = frame.FrameReference.SourceKind;
            SystemRelativeTime = frame.FrameReference.SystemRelativeTime;
            SoftwareBitmap = SoftwareBitmap.Copy(frame.SoftwareBitmap);
        }
    }
}
