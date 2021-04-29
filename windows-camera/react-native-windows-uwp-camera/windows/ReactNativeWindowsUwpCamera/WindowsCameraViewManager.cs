using Microsoft.ReactNative.Managed;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Windows.Media.Capture.Frames;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNativeWindowsUwpCamera
{
    internal class WindowsCameraViewManager :
        AttributedViewManager<CaptureElement>
    {
        public override string Name
        {
            get
            {
                return "WindowsCameraView";
            }
        }

        /// <summary>
        /// Returns camera view. Begins initialization.
        /// </summary>
        /// <returns></returns>
        public override FrameworkElement CreateView()
        {
            var cameraView = WindowsCameraView.Create();
            cameraView.InitializeSource();
            return cameraView.CaptureElement;
        }

        /// <summary>
        /// Fires when camera initialization finishes. 
        /// </summary>
        [ViewManagerExportedDirectEventTypeConstant]
        static public ViewManagerEvent<CaptureElement, bool> CameraInitialized = null;

        /// <summary>
        /// Takes picture from viewTag's corresponding camera view.
        /// </summary>
        /// <param name="viewTag"></param>
        /// <param name="type"></param>
        /// <param name="promise"></param>
        /// <returns></returns>
        public static async Task TakePicture(int viewTag, MediaFrameSourceKind type, IReactPromise<JSValueObject> promise)
        {
            if (Views.ContainsKey(viewTag))
            {
                await Views[viewTag].TakePictureAsync(type, promise);
            }
            else
            {
                ReactError err = new ReactError();
                err.Message = "Camera view not found.";

                promise.Reject(err);
            }
        }

        /// <summary>
        /// Turns camera off for corresponding viewTag
        /// </summary>
        /// <param name="viewTag"></param>
        /// <returns></returns>
        public static async Task TurnCameraOff(int viewTag)
        {
            if (Views.ContainsKey(viewTag))
            {
                await Views[viewTag].RemoveSource();
                Views.Remove(viewTag);
            }
        }

        public static void AddView(long tag, WindowsCameraView view)
        {
            Views.Add(tag, view);
            CameraInitialized(view.CaptureElement, true);
        }

        private static Dictionary<long, WindowsCameraView> Views = new Dictionary<long, WindowsCameraView>();
    }
}