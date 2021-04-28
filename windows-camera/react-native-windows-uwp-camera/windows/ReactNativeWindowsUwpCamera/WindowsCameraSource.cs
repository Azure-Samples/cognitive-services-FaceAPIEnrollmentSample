using Examples.Media.Capture;
using Examples.Media.Capture.Frames;
using System;
using System.Threading.Tasks;
using Windows.Foundation;
using Windows.Media.Capture.Frames;
using Windows.Media.Devices;
using Windows.UI.Xaml.Controls;

namespace ReactNativeWindowsUwpCamera
{
    internal class WindowsCameraSource
    {
        private CaptureElement CaptureElement { get; }
        
        private ExampleMediaCapture MediaCapture;
       
        private ExampleMediaFrameReader FrameReader { get; set; }

        private TypedEventHandler<ExampleMediaFrameReader, ExampleMediaFrameArrivedEventArgs> FrameArrivedEvent;

        public WindowsCameraSource(CaptureElement ce, TypedEventHandler<ExampleMediaFrameReader, ExampleMediaFrameArrivedEventArgs> frameArrived)
        {
            CaptureElement = ce;
            FrameArrivedEvent = frameArrived;
        }

        /// <summary>
        /// Initializes ExampleMediaCapture and FrameReader. 
        /// Turns camera on and sets camera preview.
        /// </summary>
        /// <returns></returns>
        public async Task InitializeAsync()
        {
            MediaCapture = new ExampleMediaCapture();
            await MediaCapture.InitializeAsync();
            CaptureElement.Source = MediaCapture.PreviewMediaCapture;
            CaptureElement.FlowDirection = MediaCapture.PreviewFlowDirection;
            await MediaCapture.StartPreviewAsync();

            FrameReader = await MediaCapture.CreateFrameReaderAsync();
            FrameReader.AcquisitionMode = MediaFrameReaderAcquisitionMode.Buffered;
            FrameReader.FrameArrived += FrameArrivedEvent;
            await FrameReader.StartAsync();
        }

        /// <summary>
        /// Turns camera off and handles clean up. 
        /// </summary>
        /// <returns></returns>
        public async Task CleanUp()
        {
            CaptureElement.Source = null;
            FrameReader.FrameArrived -= FrameArrivedEvent;

            try
            {
                await MediaCapture.StopPreviewAsync();
            }
            catch (Exception e) when (e.HResult == unchecked((int)0xc00dabe4) &&
                                      MediaCapture.PreviewMediaCapture.CameraStreamState != CameraStreamState.Streaming)
            {
                // StopPreview is not idempotent, silence exception when camera is not streaming
            }

            await FrameReader.StopAsync();
            FrameReader.Dispose();
        }
    }
}