---
layout: post
title:  Magento Developer Certification Adminhtml and Common structure/architecture
date:   2016-11-24 15:00:00
categories: Magento
---

Notes about `Magento Developer Certification Adminhtml and Common structure/architecture`.

6 - Adminhtml
====================

Common structure/architecture
--------------------

### Describe the similarities and differences between adminhtml and frontend interface and routing:

#### Which areas in configuration are only loaded for the admin area?

#### What is the difference between admin and frontend controllers?

#### When does Magento figure out which area to use on the current page?

#### How you can make your controller work under the /admin route?

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Adminhtml_Controller_Action][Mage_Adminhtml_Controller_Action]
* [Mage_Core_Model_Layout][Mage_Core_Model_Layout]
* [Mage_Core_Model_Layout_Update][Mage_Core_Model_Layout_Update]
* [Mage_Core_Controller_Varien_Router_Standard][Mage_Core_Controller_Varien_Router_Standard]

### Describe the components and types of cache clearing using the adminhtml interface:

#### At which moment does Magento check if a user is logged in or not?

#### Which class do most Magento adminhtml blocks extend?

#### What are the roles of adminhtml config?

#### What are the differences between the different cache types on the admin cache cleaning page?

#### What is the difference between “flush storage” and “flush Magento cache”?

#### How you can clear the cache without using the UI?

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Adminhtml_Model_Config][Mage_Adminhtml_Model_Config]
* [Mage_Adminhtml_Model_Config_Data][Mage_Adminhtml_Model_Config_Data]
* [Mage_Admin_Model_Observer][Mage_Admin_Model_Observer]
* [Mage_Core_Model_Cache][Mage_Core_Model_Cache]

#### Additional Readings


[Mage_Admin_Model_Observer]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Admin/Model/Observer.php
[Mage_Adminhtml_Model_Config]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Adminhtml/Model/Config.php
[Mage_Adminhtml_Model_Config_Data]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Adminhtml/Model/Config/Data.php
[Mage_Adminhtml_Controller_Action]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Adminhtml/Controller/Action.php
[Mage_Core_Model_Cache]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Cache.php
[Mage_Core_Controller_Varien_Router_Standard]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Controller/Varien/Router/Standard.php
[Mage_Core_Model_Layout]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Layout.php
[Mage_Core_Model_Layout_Update]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Layout/Update.php
