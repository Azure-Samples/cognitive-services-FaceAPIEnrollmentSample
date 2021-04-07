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
using Windows.Devices.Usb;
using Windows.Graphics.Imaging;

namespace Examples.Media.Capture.Internal
{
#if USE_INFRARED
    struct KSCAMERA_EXTENDEDPROP_HEADER
    {
        internal UInt32 Version;
        internal UInt32 PinId;
        internal UInt32 Size;
        internal UInt32 Result;
        internal UInt64 Flags;
        internal UInt64 Capability;

        int StructSize;

        internal static KSCAMERA_EXTENDEDPROP_HEADER FromBytes(byte[] value, int startIndex)
        {
            var KSCAMERA_EXTENDEDPROP_HEADER = new KSCAMERA_EXTENDEDPROP_HEADER();
            var caret = startIndex;

            KSCAMERA_EXTENDEDPROP_HEADER.Version = BitConverter.ToUInt32(value, caret);
            caret += sizeof(UInt32);

            KSCAMERA_EXTENDEDPROP_HEADER.PinId = BitConverter.ToUInt32(value, caret);
            caret += sizeof(UInt32);

            KSCAMERA_EXTENDEDPROP_HEADER.Size = BitConverter.ToUInt32(value, caret);
            caret += sizeof(UInt32);

            KSCAMERA_EXTENDEDPROP_HEADER.Result = BitConverter.ToUInt32(value, caret);
            caret += sizeof(UInt32);

            KSCAMERA_EXTENDEDPROP_HEADER.Flags = BitConverter.ToUInt32(value, caret);
            caret += sizeof(UInt64);

            KSCAMERA_EXTENDEDPROP_HEADER.Capability = BitConverter.ToUInt32(value, caret);
            caret += sizeof(UInt64);

            KSCAMERA_EXTENDEDPROP_HEADER.StructSize = caret;

            return KSCAMERA_EXTENDEDPROP_HEADER;
        }

        internal byte[] GetBytes()
        {
            byte[] bytes = new byte[StructSize];
            var dstOffset = 0;
            byte[] value;

            value = BitConverter.GetBytes(Version);
            Buffer.BlockCopy(value, 0, bytes, dstOffset, value.Length);
            dstOffset += value.Length;

            value = BitConverter.GetBytes(PinId);
            Buffer.BlockCopy(value, 0, bytes, dstOffset, value.Length);
            dstOffset += value.Length;

            value = BitConverter.GetBytes(Size);
            Buffer.BlockCopy(value, 0, bytes, dstOffset, value.Length);
            dstOffset += value.Length;

            value = BitConverter.GetBytes(Result);
            Buffer.BlockCopy(value, 0, bytes, dstOffset, value.Length);
            dstOffset += value.Length;

            value = BitConverter.GetBytes(Flags);
            Buffer.BlockCopy(value, 0, bytes, dstOffset, value.Length);
            dstOffset += value.Length;

            value = BitConverter.GetBytes(Capability);
            Buffer.BlockCopy(value, 0, bytes, dstOffset, value.Length);
            dstOffset += value.Length;

            return bytes;
        }
    }

    struct ULARGE_INTEGER
    {
        UInt32 HighPart;
        UInt32 LowPart;

        internal static ULARGE_INTEGER FromBytes(byte[] value, int startIndex)
        {
            var ULARGE_INTEGER = new ULARGE_INTEGER();
            var caret = startIndex;

            ULARGE_INTEGER.HighPart = BitConverter.ToUInt32(value, caret);
            caret += sizeof(UInt32);

            ULARGE_INTEGER.LowPart = BitConverter.ToUInt32(value, caret);
            caret += sizeof(UInt32);

            return ULARGE_INTEGER;
        }
    }

    struct KSCAMERA_EXTENDEDPROP_VALUE
    {
        byte[] Bytes;

        internal double dbl { get { return BitConverter.ToDouble(Bytes, 0); } }
        internal UInt64 ull { get { return BitConverter.ToUInt64(Bytes, 0); } }
        internal UInt32 ul { get { return BitConverter.ToUInt32(Bytes, 0); } }
        internal ULARGE_INTEGER ratio { get { return ULARGE_INTEGER.FromBytes(Bytes, 0); } }
        internal Int32 l { get { return BitConverter.ToInt32(Bytes, 0); } }
        internal Int64 ll { get { return BitConverter.ToInt64(Bytes, 0); } }

        internal static KSCAMERA_EXTENDEDPROP_VALUE FromBytes(byte[] value, int startIndex)
        {
            return new KSCAMERA_EXTENDEDPROP_VALUE
            {
                Bytes = value.Skip(startIndex).ToArray()
            };
        }
        internal byte[] GetBytes()
        {
            return Bytes;
        }
    }

    struct KSCAMERA_EXTENDEDPROP
    {
        int Size;
        internal KSCAMERA_EXTENDEDPROP_HEADER Header;
        internal KSCAMERA_EXTENDEDPROP_VALUE Value;

        internal static KSCAMERA_EXTENDEDPROP FromBytes(byte[] value, int startIndex)
        {
            var KSCAMERA_EXTENDEDPROP = new KSCAMERA_EXTENDEDPROP();

            var headerSize = 0;

            headerSize += sizeof(UInt32);
            headerSize += sizeof(UInt32);
            headerSize += sizeof(UInt32);
            headerSize += sizeof(UInt32);
            headerSize += sizeof(UInt64);
            headerSize += sizeof(UInt64);

            KSCAMERA_EXTENDEDPROP.Size = value.Length;
            KSCAMERA_EXTENDEDPROP.Header = KSCAMERA_EXTENDEDPROP_HEADER.FromBytes(value, startIndex);
            KSCAMERA_EXTENDEDPROP.Value = KSCAMERA_EXTENDEDPROP_VALUE.FromBytes(value, startIndex + headerSize);

            return KSCAMERA_EXTENDEDPROP;
        }

        internal byte[] GetBytes()
        {
            byte[] bytes = new byte[Size];
            var dstOffset = 0;

            var header = Header.GetBytes();
            Buffer.BlockCopy(header, 0, bytes, dstOffset, header.Length);
            dstOffset += header.Length;

            var value = Value.GetBytes();
            Buffer.BlockCopy(value, 0, bytes, dstOffset, value.Length);
            dstOffset += value.Length;

            return bytes;
        }
    }

    // ksmedia.h
    internal static class KS
    {
        // https://docs.microsoft.com/en-us/windows-hardware/drivers/stream/standardized-extended-controls-

        internal static readonly Guid   PROPERTYSETID_ExtendedCameraControl                              = new Guid(0x1CB79112, 0xC0D2, 0x4213, 0x9C, 0xA6, 0xCD, 0x4F, 0xDB, 0x92, 0x79, 0x72);

        // https://docs.microsoft.com/en-us/windows-hardware/drivers/stream/ksproperty-cameracontrol-extended-facedetection

        internal static readonly string PROPERTY_CAMERACONTROL_EXTENDED_FACEDETECTION                    = $"{KS.PROPERTYSETID_ExtendedCameraControl:B},{29}";

        internal static readonly ulong  CAMERA_EXTENDEDPROP_FACEDETECTION_OFF                            = 0x0000000000000000;
        internal static readonly ulong  CAMERA_EXTENDEDPROP_FACEDETECTION_PREVIEW                        = 0x0000000000000001;
        internal static readonly ulong  CAMERA_EXTENDEDPROP_FACEDETECTION_VIDEO                          = 0x0000000000000002;

        // https://docs.microsoft.com/en-us/windows-hardware/drivers/stream/ksproperty-cameracontrol-extended-faceauth-mode

        internal static readonly string PROPERTY_CAMERACONTROL_EXTENDED_FACEAUTH_MODE                    = $"{KS.PROPERTYSETID_ExtendedCameraControl:B},{35}";

        internal static readonly ulong  CAMERA_EXTENDEDPROP_FACEAUTH_MODE_DISABLED                       = 0x0000000000000001;
        internal static readonly ulong  CAMERA_EXTENDEDPROP_FACEAUTH_MODE_ALTERNATIVE_FRAME_ILLUMINATION = 0x0000000000000002;
        internal static readonly ulong  CAMERA_EXTENDEDPROP_FACEAUTH_MODE_BACKGROUND_SUBTRACTION         = 0x0000000000000004;
    }

    // mfapi.h
    internal static class MF
    {
        internal static readonly Guid   _DEVICESTREAM_ATTRIBUTE_FACEAUTH_CAPABILITY = new Guid(0xCB6FD12A, 0x2248, 0x4E41, 0xAD, 0x46, 0xE7, 0x8B, 0xB9, 0x0A, 0xB9, 0xFC);
    }
#endif
}
