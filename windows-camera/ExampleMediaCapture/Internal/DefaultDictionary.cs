////////////////////////////////////////////////////////////
//
// Copyright (c) Microsoft Corporation. All rights reserved.
// This code is licensed under the MIT License (MIT).
// THIS CODE IS PROVIDED *AS IS* WITHOUT WARRANTY OF
// ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING ANY
// IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR
// PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.
//
////////////////////////////////////////////////////////////

using System;
using System.Collections;
using System.Collections.Generic;
using System.Reflection;

namespace Examples.Media.Capture.Internal
{
#if USE_INFRARED

    internal class DefaultDictionary<TKey, TValue> : Dictionary<TKey, TValue>
    {
        internal TValue Default
        {
            get
            {
                if (typeof(IEnumerable).IsAssignableFrom(typeof(TValue)))
                {
                    try
                    {
                        return Activator.CreateInstance<TValue>();
                    }
                    catch (MissingMethodException) { }
                }
                return default;
            }
        }

        internal new TValue this[TKey key]
        {
            get
            {
                if (!TryGetValue(key, out TValue val))
                {
                    val = Default;
                    Add(key, val);
                }
                return val;
            }
            set { base[key] = value; }
        }
    }
#endif
}
