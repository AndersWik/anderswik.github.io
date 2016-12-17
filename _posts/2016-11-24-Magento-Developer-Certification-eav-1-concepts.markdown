---
layout: post
title:  Magento Developer Certification Entity-Attribute-Value (EAV) Model and EAV model concepts
date:   2016-11-24 15:00:00
categories: Magento
---

Notes about `Magento Developer Certification Entity-Attribute-Value (EAV) Model and EAV model concepts`.

5 - Entity-Attribute-Value (EAV) Model
====================

EAV model concepts
--------------------

### Define basic EAV concepts and class hierarchy

### Describe the database schema for EAV entities

### Describe the EAV entity structure and its difference from the standard core resource model

### Describe the EAV load-and-save process and its differences from the regular load- and-save process

#### This objective covers understanding how EAV entity values are stored in the database, how the involved tables relate, how the EAV resource models differ from the flat table resource models and how the EAV models process CRUD operations.

#### Which classes in Mage_Eav are used as resource models and which are used as regular models?

#### How do flat and EAV resource models differ?

#### Which entities in a native Magento installation use EAV resource models and why?

#### What are the advantages and disadvantages of EAV over flat table resource models?

#### How are store and website scope attribute values implemented in the Magneto EAV system?

#### How does the model distinguish between insert and update operations?

#### How do load and save processes for EAV entities differ from those for flat table entities? What parts are identical?

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Eav_Model_Config][Mage_Eav_Model_Config]
* [Mage_Eav_Model_Entity_Abstract][Mage_Eav_Model_Entity_Abstract]
* [Mage_Eav_Model_Entity_Collection_Abstract][Mage_Eav_Model_Entity_Collection_Abstract]
* [Mage_Eav_Model_Entity_Abstract::load()][Mage_Eav_Model_Entity_Abstract::load] and [save()][Mage_Eav_Model_Entity_Abstract::save]
* [Mage_Core_Model_Abstract::load() and save()][Mage_Core_Model_Abstract::load() and save]
* [Mage_Eav_Model_Entity_Collection_Abstract::load()][Mage_Eav_Model_Entity_Collection_Abstract::load]

#### Additional Readings




[Mage_Eav_Model_Config]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Eav/Model/Config.php
[Mage_Eav_Model_Entity_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Eav/Model/Entity/Abstract.php
[Mage_Eav_Model_Entity_Collection_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Eav/Model/Entity/Collection/Abstract.php
[Mage_Eav_Model_Entity_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Eav/Model/Entity/Abstract.php
[Mage_Eav_Model_Entity_Abstract::load]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Eav/Model/Entity/Abstract.php#L936
[Mage_Eav_Model_Entity_Abstract::save]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Eav/Model/Entity/Abstract.php#L1106
[Mage_Eav_Model_Entity_Collection_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Eav/Model/Entity/Collection/Abstract.php
[Mage_Eav_Model_Entity_Collection_Abstract::load]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Eav/Model/Entity/Collection/Abstract.php#L857
