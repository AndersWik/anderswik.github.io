---
layout: post
title:  Magento Developer Certification Entity-Attribute-Value (EAV) Model and Attributes management
date:   2016-11-24 15:00:00
categories: Magento
---

Notes about `Magento Developer Certification Entity-Attribute-Value (EAV) Model and Attributes management`.

5 - Entity-Attribute-Value (EAV) Model
====================

Attributes management
--------------------

### Identify the purpose of attribute frontend, source, and backend models

### Describe how to implement the interface of attribute frontend, source, and backend models:

#### How do attribute models, attribute source models, attribute backend models and attribute frontend models relate to each other?

#### Which methods have to be implemented in a custom source model (or frontend model or backend model)?

#### Can adminhtml system configuration source models also be used for EAV attributes?

#### What is the default frontend model (and source and backend model) for EAV attributes?

#### Does every attribute use a source model?

#### Which classes and methods are related to updating the EAV attribute

#### values in the flat catalog tables? What factors allow for attributes to be added to flat catalog tables?

#### How are store-scoped entity attribute values stored when catalog flat storage is enabled for that entity type?

#### Which frontend, source, and backend models are available in a stock Magento installation?

#### How do multi-lingual options for attributes work in Magento?

#### How do you get a list of all options for an attribute for a specified store view in addition to the admin scope?

#### These code references can be used as an entry point to find answers to the questions above:


* [Mage_Eav_Model_Entity_Attribute_Abstract][Mage_Eav_Model_Entity_Attribute_Abstract]
* [Mage_Eav_Model_Entity_Attribute_Backend_Abstrace][Mage_Eav_Model_Entity_Attribute_Backend_Abstrace]
* [Mage_Eav_Model_Entity_Attribute_Frontend_Abstract][Mage_Eav_Model_Entity_Attribute_Frontend_Abstract]
* [Mage_Eav_Model_Entity_Attribute_Source_Abstract][Mage_Eav_Model_Entity_Attribute_Source_Abstract]
* [Mage_Eav_Model_Entity_Attribute_Source_Table][Mage_Eav_Model_Entity_Attribute_Source_Table]
* [Mage_Eav_Model_Resource_Entity_Attribute_Option_Collection::load()][Mage_Eav_Model_Resource_Entity_Attribute_Option_Collection::load]

### Describe how to create and customize attributes.

#### Besides simply using the stock EAV attributes that come with Magento, one of the most common operations for developers is to modify or create attributes.

#### Which setup methods are available to work with EAV entities?

#### How can an EAV setup class be instantiated in a setup script if not specified in the XML <class> configuration for a setup resource?

#### What is the difference between addAttribute() and updateAttribute()?

#### What are the advantages of using a custom setup class for manipulating EAV attributes in a custom module?

#### This code reference can be used as an entry point to find answers to the questions above:

* [Mage_Eav_Model_Entity_Setup][Mage_Eav_Model_Entity_Setup]

#### Additional Readings





[Mage_Eav_Model_Entity_Attribute_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Eav/Model/Entity/Attribute/Abstract.php
[Mage_Eav_Model_Entity_Attribute_Backend_Abstrace]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Eav/Model/Entity/Attribute/Backend/Abstract.php
[Mage_Eav_Model_Entity_Attribute_Frontend_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Eav/Model/Entity/Attribute/Frontend/Abstract.php
[Mage_Eav_Model_Entity_Attribute_Source_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Eav/Model/Entity/Attribute/Source/Abstract.php
[Mage_Eav_Model_Entity_Attribute_Source_Table]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Eav/Model/Entity/Attribute/Source/Abstract.php
[Mage_Eav_Model_Entity_Setup]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Eav/Model/Entity/Setup.php
[Mage_Eav_Model_Resource_Entity_Attribute_Option_Collection]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Eav/Model/Resource/Entity/Attribute/Option/Collection.php
[Mage_Eav_Model_Resource_Entity_Attribute_Option_Collection::load]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Eav/Model/Resource/Entity/Attribute/Option/Collection.php
