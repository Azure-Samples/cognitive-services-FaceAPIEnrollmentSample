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

        public async Task<string> AquireLatestColorFrame()
        {
            string base64 = "";

            using (var frameRef = FrameReader.TryAcquireLatestFrameBySourceKind(MediaFrameSourceKind.Color))
            {
                if(frameRef != null)
                {
                    base64 = await ConvertToBase64(frameRef);
                }
            }

            return base64;
        }

        public static async Task<string> ConvertToBase64(MediaFrameReference mediaFrameReference)
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
    }
}
