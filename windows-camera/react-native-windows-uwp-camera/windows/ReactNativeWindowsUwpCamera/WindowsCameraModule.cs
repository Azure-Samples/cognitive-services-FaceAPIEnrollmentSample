using Microsoft.ReactNative.Managed;
using Windows.Media.Capture.Frames;

namespace ReactNativeWindowsUwpCamera
{
    [ReactModule]
    internal class WindowsCameraModule
    {
        [ReactMethod("takeColorPictureAsync")]
        public async void TakeColorPictureAsync(int viewTag, IReactPromise<JSValueObject> promise)
        {
            await WindowsCameraViewManager.TakePicture(viewTag, MediaFrameSourceKind.Color, promise);
        }

        [ReactMethod("takeInfraredPictureAsync")]
        public async void TakeInfraredPictureAsync(int viewTag, IReactPromise<JSValueObject> promise)
        {
            await WindowsCameraViewManager.TakePicture(viewTag, MediaFrameSourceKind.Infrared, promise);
        }

        [ReactMethod("turnCameraOff")]
        public void TurnCameraOff(int viewTag)
        {
            WindowsCameraViewManager.TurnCameraOff(viewTag);
        }
    }
}