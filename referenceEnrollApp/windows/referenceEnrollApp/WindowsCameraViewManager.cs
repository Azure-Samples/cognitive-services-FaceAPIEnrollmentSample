using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Controls;

using Microsoft.ReactNative.Managed;
using Windows.UI.Xaml;
using Windows.Media.Capture.Frames;
using System.Threading;
using System.Diagnostics.Contracts;
using Windows.UI.Xaml.Controls.Maps;
using Windows.ApplicationModel.Appointments.DataProvider;
using Examples.Media.Capture.Frames;
using Windows.UI.Core;
using Microsoft.ReactNative;
using Windows.Storage.Streams;
using Windows.Graphics.Imaging;
using System.Runtime.InteropServices.WindowsRuntime;

namespace referenceEnrollApp
{
    public class WindowsCameraViewManager : 
        AttributedViewManager<CaptureElement>
    {
        public override string Name
        {
            get
            {
                return "WindowsCameraView";
            }
        }

        public override FrameworkElement CreateView()
        {
            var cameraView = WindowsCameraView.Create();
            cameraView.InitializeSource();
            views.Add(cameraView);


            return cameraView.CaptureElement;
        }

        [ViewManagerExportedDirectEventTypeConstant]
        static public ViewManagerEvent<CaptureElement, bool> CameraInitialized = null;

        public static async Task TakePicture(int viewTag, MediaFrameSourceKind type, IReactPromise<string> promise)
        {
            int index = FindCameraView(viewTag);

            if (index != -1)
            {
                await views[index].TakePictureAsync(type, promise);
            }
            else
            {
                ReactError err = new ReactError();
                err.Message = "Camera view not found.";

                promise.Reject(err);
            }
        }

        public static async Task TurnCameraOff(int viewTag)
        {
            int index = FindCameraView(viewTag);

            if (index != -1)
            {
                await views[index].RemoveSource();
                views.RemoveAt(index);
            }
        }

        private static int FindCameraView(int viewTag)
        {
            for (int i = 0; i < views.Count(); i++)
            {
                var value = views[i].CaptureElement.GetValue(FrameworkElement.TagProperty);
                var tag = Convert.ToInt64(value);
                if (tag == viewTag)
                {
                    return i;
                }
            }

            return -1;
        }

        private static List<WindowsCameraView> views = new List<WindowsCameraView>();
    }
}
