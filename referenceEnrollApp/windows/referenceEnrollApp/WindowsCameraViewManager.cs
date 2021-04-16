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
    [ReactModule]
    public class WindowsCameraViewManager : AttributedViewManager<CaptureElement>, IViewManagerWithReactContext
    {
        protected string _data;

        private ReactDispatcherCallback callback;

        private WindowsCameraSource wcs;

        private IReactDispatcher dispatcher;

        private IReactPropertyBag props;

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
            var view = new CaptureElement();

            dispatcher = ReactContext.UIDispatcher;
            callback = new ReactDispatcherCallback(frameArriveUIEvent);
            props = ReactPropertyBagHelper.CreatePropertyBag();

            //nsp = new namespaceProperty("WindowsCameraViewManager");
            //prop = new nameProperty("FraveArrive", nsp);

            wcs = new WindowsCameraSource(view, FrameReader_FrameArrived);
            return view;
        }

        [ViewManagerProperty("type")]
        public async void SetType(CaptureElement view, int type)
        {
            await wcs.InitializeAsync();
        }

        [ViewManagerExportedDirectEventTypeConstant]
        public ViewManagerEvent<CaptureElement, string> FrameArrivedEvent = null;

        public void frameArriveUIEvent()
        {
            var k = props.Get(propertyName);
            //props.Set(propertyName, null);
            FrameArrivedEvent?.Invoke(wcs.CaptureElement, k.ToString());
        }

        public void FrameReader_FrameArrived(ExampleMediaFrameReader sender, ExampleMediaFrameArrivedEventArgs args)
        {
            try
            {
                using (var mediaFrameReference = sender.TryAcquireLatestFrameBySourceKind(args.SourceKind))
                {
                    if (dispatcher.HasThreadAccess == false)
                    {
                        if (mediaFrameReference != null)
                        {
                            if(mediaFrameReference.SourceKind == MediaFrameSourceKind.Color)
                            {
                               var base64 = ConvertToBase64(mediaFrameReference).GetAwaiter().GetResult();
                                props.Set(propertyName, base64);
                                dispatcher.Post(callback);
                            }
                        }
                    }
                }
            }
            catch (ObjectDisposedException) { }
            finally
            {
            }
        }

        private async Task<string> ConvertToBase64(MediaFrameReference mediaFrameReference)
        {
            var bitmap = mediaFrameReference.VideoMediaFrame.SoftwareBitmap;
            byte[] array = null;
            string base64 = "";

            using (var ms = new InMemoryRandomAccessStream())
            {
                SoftwareBitmap compatibleBitmap = null;
                if (bitmap.BitmapPixelFormat != BitmapPixelFormat.Bgra8 ||
                    bitmap.BitmapAlphaMode != BitmapAlphaMode.Ignore)
                {
                    compatibleBitmap = SoftwareBitmap.Convert(bitmap, BitmapPixelFormat.Bgra8, BitmapAlphaMode.Ignore);
                }
                else
                {
                    compatibleBitmap = bitmap;
                }
                var encodingOptions = new BitmapPropertySet();
                encodingOptions.Add("ImageQuality", new BitmapTypedValue(
                        1.0, // Maximum quality
                        Windows.Foundation.PropertyType.Single));

                BitmapEncoder encoder = await BitmapEncoder.CreateAsync(BitmapEncoder.JpegEncoderId, ms, encodingOptions);
                encoder.SetSoftwareBitmap(compatibleBitmap);

                try
                {
                    await encoder.FlushAsync();
                }
                catch (Exception ex) { }

                array = new byte[ms.Size];
                await ms.ReadAsync(array.AsBuffer(), (uint)ms.Size, InputStreamOptions.None);
                base64 = Convert.ToBase64String(array);
                compatibleBitmap.Dispose();
            }

            return base64;
        }

        private static IReactPropertyNamespace propertyNamespace = ReactPropertyBagHelper.GetNamespace("WindowsCameraViewManager");
        private static IReactPropertyName propertyName = ReactPropertyBagHelper.GetName(propertyNamespace, "FrameArrive");
    /*
    public class nameProperty : IReactPropertyName
    {
        public nameProperty(string name, IReactPropertyNamespace ns)
        {
            LocalName = name;
            Namespace = ns;
        }

        public string LocalName { get; set; }

        public IReactPropertyNamespace Namespace { get; set; }
    }

    public class namespaceProperty : IReactPropertyNamespace
    {
        public namespaceProperty(string n)
        {
            NamespaceName = n;
        }
        public string NamespaceName { get; set; }
    }
    */
    }
}
