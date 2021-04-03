using System;
using System.Threading.Tasks;
using Examples.Media.Capture;
using Microsoft.ReactNative.Managed;
using Windows.Media.Capture;
using Windows.UI.Xaml.Controls;

namespace referenceEnrollApp
{
    public class WindowsCameraSource
    {
        private ExampleMediaCapture emc;
        public CaptureElement CaptureElement { get; }

        public WindowsCameraSource(CaptureElement ce)
        {
            CaptureElement = ce;
        }

        public async Task InitializeAsync()
        {
            emc = new ExampleMediaCapture();
            await emc.InitializeAsync();

            CaptureElement.Source = emc.PreviewMediaCapture;
            CaptureElement.FlowDirection = emc.PreviewFlowDirection;
            await emc.StartPreviewAsync();
        }
    }
}
