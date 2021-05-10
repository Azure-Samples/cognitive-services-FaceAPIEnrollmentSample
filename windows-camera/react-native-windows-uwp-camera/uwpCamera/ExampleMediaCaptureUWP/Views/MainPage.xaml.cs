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

using ExampleMediaCaptureUWP.Views;
using Microsoft.UI.Xaml.Controls;
using System;
using System.Collections.Generic;
using System.Linq;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Media.Animation;
using Page = Windows.UI.Xaml.Controls.Page;

// The Blank Page item template is documented at https://go.microsoft.com/fwlink/?LinkId=402352&clcid=0x409

namespace ExampleMediaCaptureUWP
{
    /// <summary>
    /// An otherwise empty page that only contains this element:
    /// <CaptureElement x:Name="CaptureElement"/>
    /// </summary>
    public sealed partial class MainPage : Page
    {
        public MainPage()
        {
            this.InitializeComponent();
        }

        private readonly List<(string Tag, Type Page)> Pages = new List<(string Tag, Type Page)>
        {
            ("Home", typeof(HomePage)),
            ("DataCollect", typeof(DataCollectPage)),
            ("AccessControl", typeof(AccessControlPage)),
        };

        private void NavigationView_Loaded(object sender, RoutedEventArgs e)
        {
            NavigationView.SelectedItem = NavigationView.MenuItems[0];
        }

        private void NavigationView_ItemInvoked(NavigationView sender, NavigationViewItemInvokedEventArgs args)
        {
            if (args.IsSettingsInvoked == true)
            {
                NavigationView_Navigate("settings", args.RecommendedNavigationTransitionInfo);
            }
            else if (args.InvokedItemContainer != null)
            {
                var navigationItemTag = args.InvokedItemContainer.Tag.ToString();
                NavigationView_Navigate(navigationItemTag, args.RecommendedNavigationTransitionInfo);
            }
        }

        private void NavigationView_Navigate(string navigationItemTag, NavigationTransitionInfo transitionInfo)
        {
            Type page = null;
            if (navigationItemTag == "settings")
            {
                // _page = typeof(SettingsPage);
            }
            else
            {
                var item = Pages.FirstOrDefault(p => p.Tag.Equals(navigationItemTag));
                page = item.Page;
            }
            // Get the page type before navigation so you can prevent duplicate
            // entries in the backstack.
            var preNavPageType = NavigationViewFrame.CurrentSourcePageType;

            // Only navigate if the selected page isn't currently loaded.
            if (!(page is null) && !Type.Equals(preNavPageType, page))
            {
                NavigationViewFrame.Navigate(page, null, transitionInfo);
            }
        }
    }
}
