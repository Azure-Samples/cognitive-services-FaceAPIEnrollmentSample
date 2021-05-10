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

using Windows.Media.Capture.Frames;

namespace Examples.Media.Capture.Frames
{
    public sealed class ExampleMediaFrameArrivedEventArgs
    {
        public MediaFrameSourceKind SourceKind { get; }

        internal ExampleMediaFrameArrivedEventArgs(MediaFrameSourceKind sourceKind)
        {
            SourceKind = sourceKind;
        }
    }
}
