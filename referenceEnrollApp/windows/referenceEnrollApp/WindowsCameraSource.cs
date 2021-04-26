using System;
using System.Runtime.InteropServices.WindowsRuntime;
using System.Threading;
using System.Threading.Tasks;
using Examples.Media.Capture;
using Examples.Media.Capture.Frames;
using Microsoft.ReactNative.Managed;
using Windows.Devices.PointOfService.Provider;
using Windows.Foundation;
using Windows.Graphics.Imaging;
using Windows.Media.Capture;
using Windows.Media.Capture.Frames;
using Windows.Media.Devices;
using Windows.Storage.Streams;
using Windows.UI.Xaml.Controls;
using static referenceEnrollApp.WindowsCameraViewManager;

namespace referenceEnrollApp
{
    public class WindowsCameraSource
    {
        private ExampleMediaCapture emc;
        public CaptureElement CaptureElement { get; }

        private ExampleMediaFrameReader FrameReader { get; set; }

        public TypedEventHandler<ExampleMediaFrameReader, ExampleMediaFrameArrivedEventArgs> fa;

        public WindowsCameraSource(CaptureElement ce, TypedEventHandler<ExampleMediaFrameReader, ExampleMediaFrameArrivedEventArgs> frameArrived)
        {
            CaptureElement = ce;
            fa = frameArrived;
        }

        public async Task InitializeAsync()
        {
            emc = new ExampleMediaCapture();
            await emc.InitializeAsync();
            CaptureElement.Source = emc.PreviewMediaCapture;
            CaptureElement.FlowDirection = emc.PreviewFlowDirection;
            await emc.StartPreviewAsync();

            FrameReader = await emc.CreateFrameReaderAsync();
            FrameReader.AcquisitionMode = MediaFrameReaderAcquisitionMode.Buffered;
            FrameReader.FrameArrived += fa;
            await FrameReader.StartAsync();
        }

        public async Task CleanUp()
        {
            CaptureElement.Source = null;
            FrameReader.FrameArrived -= fa;

            try
            {
                await emc.StopPreviewAsync();
            }
            catch (Exception e) when (e.HResult == unchecked((int)0xc00dabe4) &&
                                      emc.PreviewMediaCapture.CameraStreamState != CameraStreamState.Streaming)
            {
                // StopPreview is not idempotent, silence exception when camera is not streaming
            }

            await FrameReader.StopAsync();
            FrameReader.Dispose();
        }
    }
}
