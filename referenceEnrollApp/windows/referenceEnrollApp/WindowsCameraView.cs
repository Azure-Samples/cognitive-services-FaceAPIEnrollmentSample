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

        private volatile SoftwareBitmap colorFrame = null;

        private volatile SoftwareBitmap irFrame = null;

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

        public async Task TakePictureAsync(MediaFrameSourceKind type, IReactPromise<string> promise)
        {
            var base64Frame = "";

            if (type == MediaFrameSourceKind.Color && colorFrame != null)
            {
                base64Frame = await ConvertToBase64(colorFrame);
            }

            if (type == MediaFrameSourceKind.Infrared && irFrame != null)
            {
                base64Frame = await ConvertToBase64(irFrame);
            }

            if (string.IsNullOrEmpty(base64Frame))
            {
                var err = new ReactError();
                err.Message = "Error taking picture";
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
            colorFrame.Dispose();
            colorFrame = null;
            irFrame.Dispose();
            irFrame = null;
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
                                colorFrame = mediaFrameReference.VideoMediaFrame.SoftwareBitmap;
                            }

                            if (mediaFrameReference.SourceKind == MediaFrameSourceKind.Infrared)
                            {
                                if (mediaFrameReference.VideoMediaFrame.InfraredMediaFrame.IsIlluminated)
                                {
                                    irFrame = mediaFrameReference.VideoMediaFrame.SoftwareBitmap;
                                }
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

        public static async Task<string> ConvertToBase64(SoftwareBitmap bitmap)
        {
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
