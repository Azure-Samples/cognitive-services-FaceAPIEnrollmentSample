using Microsoft.ReactNative.Managed;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace referenceEnrollApp
{
    [ReactModule]
    class WindowsCameraModule
    {
        [ReactMethod("takePictureAsync")]
        public async void TakePictureAsync(int viewTag, IReactPromise<string> promise)
        {
            await WindowsCameraViewManager.TakePicture(viewTag, promise);
        }

        [ReactMethod("turnCameraOff")]
        public void turnCameraOff(int viewTag)
        {
           WindowsCameraViewManager.TurnCameraOff(viewTag);
        }
    }
}
