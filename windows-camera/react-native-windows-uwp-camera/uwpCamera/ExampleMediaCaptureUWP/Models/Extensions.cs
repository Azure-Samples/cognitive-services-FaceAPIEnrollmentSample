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
using System.Collections.Generic;
using System.Linq;
using System.Reactive.Concurrency;
using System.Reactive.Linq;
using System.Reactive.Threading.Tasks;
using System.Threading.Tasks;

namespace ExampleMediaCaptureUWP.Models
{
    public static class Extensions
    {
        public static IEnumerable<T> AsCompleted<T>(this IEnumerable<Task<T>> source, IScheduler scheduler = null)
        {
            return source.Select(task => task.ToObservable()).Merge().ObserveOn(scheduler ?? NewThreadScheduler.Default).ToEnumerable();
        }
    }
}
