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
        protected string _data;

        //private IReactDispatcher dispatcher;

        //private IReactPropertyBag props;

        //private namespaceProperty nsp;

        //private nameProperty prop;

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
            views.Add(cameraView);

            return cameraView.CaptureElement;
        }

        [ViewManagerProperty("type")]
        public async void SetType(CaptureElement view, int type)
        {
            int tag = Convert.ToInt32(view.Tag);
            var index = FindCameraView(tag);

            if(index != -1)
            {
                await views[index].InitializeSource();
            }
        }

        [ViewManagerExportedDirectEventTypeConstant]
        public ViewManagerEvent<CaptureElement, string> FrameArrivedEvent = null;

        public void frameArriveUIEvent()
        {
            //var k = props.Get(propertyName);
            //props.Set(propertyName, null);
            //var k = ReactContext.Properties.Get(propertyName);
            //var s = k.ToString(); 
            //FrameArrivedEvent?.Invoke(wcs.CaptureElement, "");
        }

        public static async Task TakePicture(int viewTag, IReactPromise<string> promise)
        {
            int index = FindCameraView(viewTag);

            if (index != -1)
            {
                await views[index].TakePictureAsync(promise);
            }
            else
            {
                ReactError err = new ReactError();
                err.Message = "Camera view not found.";

                promise.Reject(err);
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

        private static IReactPropertyNamespace propertyNamespace = ReactPropertyBagHelper.GetNamespace("WindowsCameraViewManager");
        private static IReactPropertyName propertyName = ReactPropertyBagHelper.GetName(propertyNamespace, "FrameArrive");
    }
}
