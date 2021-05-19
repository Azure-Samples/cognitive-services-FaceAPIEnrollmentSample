using Microsoft.ReactNative.Managed;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.Media.Capture.Frames;

namespace referenceEnrollApp
{
    [ReactModule]
    class WindowsCameraModule
    {
        [ReactMethod("takeColorPictureAsync")]
        public async void TakeColorPictureAsync(int viewTag, IReactPromise<string> promise)
        {
            await WindowsCameraViewManager.TakePicture(viewTag, MediaFrameSourceKind.Color, promise);
        }

        [ReactMethod("takeInfraredPictureAsync")]
        public async void TakeInfraredPictureAsync(int viewTag, IReactPromise<string> promise)
        {
            await WindowsCameraViewManager.TakePicture(viewTag, MediaFrameSourceKind.Infrared, promise);
        }

        [ReactMethod("turnCameraOff")]
        public void turnCameraOff(int viewTag)
        {
           WindowsCameraViewManager.TurnCameraOff(viewTag);
        }
    }
}
