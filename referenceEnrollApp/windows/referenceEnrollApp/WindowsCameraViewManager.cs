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

        private namespaceProperty nsp;

        private nameProperty prop;

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

            nsp = new namespaceProperty("WindowsCameraViewManager");
            prop = new nameProperty("FraveArrive", nsp);

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
            var k = props.Get(prop);
            ///FrameArrivedEvent?.Invoke(wcs.CaptureElement, k.ToString());
        }

        [ReactMethod]
        public string takePicture()
        {
            var k = props.Get(prop);
            return k.ToString();
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
                            props.Set(prop, mediaFrameReference?.SourceKind);
                            dispatcher.Post(callback);
                        }
                    }
                }
            }
            catch (ObjectDisposedException) { }
            finally
            {
            }
        }

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
    }
}
