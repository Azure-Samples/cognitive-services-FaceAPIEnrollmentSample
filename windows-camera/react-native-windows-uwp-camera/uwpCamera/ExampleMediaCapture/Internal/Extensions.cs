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
using Windows.Foundation;

namespace Examples.Media.Capture.Internal
{
    internal static class Extensions
    {
        internal static Rect Rotate(this Rect input, int clockwiseAngle)
        {
            Rect rotated = default;
            switch (clockwiseAngle)
            {
                case 90:
                    rotated.X = 1.0f - (input.Y + input.Height);
                    rotated.Y = input.X;
                    rotated.Width = input.Height;
                    rotated.Height = input.Width;
                    break;
                case 180:
                    rotated.X = 1.0f - (input.X + input.Width);
                    rotated.Y = 1.0f - (input.Y + input.Height);
                    rotated.Width = input.Width;
                    rotated.Height = input.Height;
                    break;
                case 270:
                    rotated.X = input.Y;
                    rotated.Y = 1.0f - (input.X + input.Width);
                    rotated.Width = input.Height;
                    rotated.Height = input.Width;
                    break;
                default:
                    throw new NotImplementedException();
            }
            return rotated;
        }
    }
}
