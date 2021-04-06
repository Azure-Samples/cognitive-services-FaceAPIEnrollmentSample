using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Threading.Tasks;
using System.Xml;
using System.Xml.Linq;
using Windows.Foundation.Collections;
using Windows.Storage.Streams;

namespace Examples.Media.Capture.Utilities
{
    public static class MetadataWriter
    {
        public static void WriteSerialization(IOutputStream stream, params IPropertySet[] properties)
        {
            var serializer = new DataContractJsonSerializer(typeof(ValueSet), new DataContractJsonSerializerSettings
            {
                UseSimpleDictionaryFormat = true
            });

            var content = new ValueSet();
            foreach (var property in properties.SelectMany(p => p))
            {
                try
                {
                    content.Add(property);
                }
                catch (Exception e) when (e.HResult == unchecked((int)0x8007065E))
                {
                    content[property.Key] = property.Value.ToString();
                }
            }

            serializer.WriteObject(stream.AsStreamForWrite(), content);
        }
    }
}
