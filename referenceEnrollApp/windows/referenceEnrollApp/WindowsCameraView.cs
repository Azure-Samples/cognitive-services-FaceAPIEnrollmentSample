using Examples.Media.Capture.Frames;
using Microsoft.ReactNative.Managed;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices.WindowsRuntime;
using System.Text;
using System.Threading.Tasks;
using Windows.Graphics.Imaging;
using Windows.Media.Capture.Frames;
using Windows.Storage.Streams;
using Windows.UI.Xaml.Controls;

namespace referenceEnrollApp
{
    class WindowsCameraView
    {
        public CaptureElement CaptureElement { get; set; }

        private WindowsCameraSource source;

        private string frame;

        WindowsCameraView()
        {
            CaptureElement = new CaptureElement();
            source = new WindowsCameraSource(CaptureElement, FrameReader_FrameArrived);
        }

        public static WindowsCameraView Create()
        {
            var view = new WindowsCameraView();

            return view;
        }

        public async Task TakePictureAsync(IReactPromise<string> promise)
        {
            var base64Frame = await source.AquireLatestColorFrame();

            if (string.IsNullOrEmpty(base64Frame))
            {
                var err = new ReactError();
                err.Message = "Frame reader not initialized";
                promise.Reject(err);
            }

            promise.Resolve(base64Frame);
        }

        public async Task InitializeSource()
        {
            await source.InitializeAsync();
            WindowsCameraViewManager.CameraInitialized(CaptureElement, true);
        }
        
        public async Task RemoveSource()
        {
            await source.CleanUp();
        }

        public void FrameReader_FrameArrived(ExampleMediaFrameReader sender, ExampleMediaFrameArrivedEventArgs args)
        {
            try
            {
                using (var mediaFrameReference = sender.TryAcquireLatestFrameBySourceKind(args.SourceKind))
                {
                    {
                        if (mediaFrameReference != null)
                        {
                            if (mediaFrameReference.SourceKind == MediaFrameSourceKind.Color)
                            {
                                var base64 = ConvertToBase64(mediaFrameReference).GetAwaiter().GetResult();
                                frame = base64;
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
    }
}
