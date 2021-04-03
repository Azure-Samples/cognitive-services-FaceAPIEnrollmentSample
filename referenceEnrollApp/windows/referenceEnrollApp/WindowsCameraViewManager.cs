using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Controls;

using Microsoft.ReactNative.Managed;
using Windows.UI.Xaml;

namespace referenceEnrollApp
{
    public class WindowsCameraViewManager : AttributedViewManager<CaptureElement>
    {
        protected string _data;

        private WindowsCameraSource wcs; 

        public override string Name
        {
            get
            {
                return "WindowsCameraView";
            }
        }

        public override FrameworkElement CreateView()
        {
            return  new CaptureElement();
        }

        [ViewManagerProperty("type")]
        public async void SetType(CaptureElement view, int type)
        {
            Console.WriteLine("getting to set type");
            wcs = new WindowsCameraSource(view);
            await wcs.InitializeAsync();
        }

        [ViewManagerProperty("size")]
        public async void setSize(CaptureElement view, int size)
        {
            view.Height = 100;
            view.Width = 100;
        }
    }
}
