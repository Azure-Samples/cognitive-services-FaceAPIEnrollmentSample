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

namespace Examples.Media.Capture.FaceAnalysis
{
    public sealed class FaceDetectedEventArgs
    {
        public FaceDetectionEffectFrame ResultFrame { get; }

        internal FaceDetectedEventArgs(FaceDetectionEffectFrame frame)
        {
            ResultFrame = frame;
        }
    }
}
