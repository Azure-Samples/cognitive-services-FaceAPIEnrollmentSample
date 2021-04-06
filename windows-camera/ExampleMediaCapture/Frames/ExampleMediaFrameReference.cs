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
using Windows.Media.Capture.Frames;

namespace Examples.Media.Capture.Frames
{
    public sealed class ExampleMediaFrameReference : IDisposable
    {
        public bool IsFaceDetected { get; }

        public MediaFrameReference TryGetFrameReferenceBySourceKind(MediaFrameSourceKind sourceKind)
        {
            return MediaFrameReferences[sourceKind];
        }

        public void Dispose() { }

        internal ExampleMediaFrameReference(IDictionary<MediaFrameSourceKind, MediaFrameReference> frameReferences, bool isFaceDetected)
        {
            MediaFrameReferences = frameReferences;
            IsFaceDetected = isFaceDetected;
        }

        private readonly IDictionary<MediaFrameSourceKind, MediaFrameReference> MediaFrameReferences;
    }
}
