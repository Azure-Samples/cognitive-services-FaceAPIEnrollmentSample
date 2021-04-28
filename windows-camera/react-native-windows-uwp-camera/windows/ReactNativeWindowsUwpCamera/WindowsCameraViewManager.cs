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
            Views.Add(cameraView);

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
            int index = FindCameraView(viewTag);

            if (index != -1)
            {
                await Views[index].TakePictureAsync(type, promise);
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
            int index = FindCameraView(viewTag);

            if (index != -1)
            {
                await Views[index].RemoveSource();
                Views.RemoveAt(index);
            }
        }

        /// <summary>
        /// Uses viewTag to find corresponding camera View in Views list. 
        /// </summary>
        /// <param name="viewTag"></param>
        /// <returns>Returns index of view. -1 otherwise. </returns>
        private static int FindCameraView(int viewTag)
        {
            for (int i = 0; i < Views.Count(); i++)
            {
                var value = Views[i].CaptureElement.GetValue(FrameworkElement.TagProperty);
                var tag = Convert.ToInt64(value);
                if (tag == viewTag)
                {
                    return i;
                }
            }

            return -1;
        }

        private static List<WindowsCameraView> Views = new List<WindowsCameraView>();
    }
}