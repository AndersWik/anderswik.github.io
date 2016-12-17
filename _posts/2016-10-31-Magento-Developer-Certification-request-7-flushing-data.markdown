---
layout: post
title:  Magento Developer Certification Request Flow and Flushing data (output)
date:   2016-11-07 18:00:00
categories: Magento
---

Notes about `Magento Developer Certification the Request Flow and Flushing data (output)`.

2 - Request Flow
====================

Design and layout initialization
--------------------


### Describe how and when Magento renders content to the browser

### Describe how and when Magento flushes output variables using the Front controller

#### This objective covers the response object as well as combining JavaScript and CSS files.

#### Which events are associated with sending output?

#### Which class is responsible for sending output?

#### What are possible issues when this output is not sent to the browser using the typical output mechanism, but is instead sent to the browser directly?

#### How are redirects handled?

#### These code references can be used as an entry point to find answers to the questions above:

* Mage_Core_Controller_Varien_Front::dispatch()
* Mage_Core_Controller_Response_Http and super classes
* Mage_Page_Block_Html_Head::getCssJsHtml()
