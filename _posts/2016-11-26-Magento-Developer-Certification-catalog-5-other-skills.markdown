---
layout: post
title:  Magento Developer Certification Catalog and Other Skills
date:   2016-11-26 15:00:00
categories: Magento
---

Notes about `Magento Developer Certification Catalog and Other Skills`.

7- Catalog
===========

Other Skills
------------

### Choose optimal catalog structure (EAV vs. Flat) for a given implementation

Flat tables are faster. But if you need to add or remove attributes more dynamically EAV might be more suited.

### Implement, troubleshoot, and modify Magento tax rules

### Modify, extend, and troubleshoot the Magento layered (“filter”) navigation

### Troubleshoot and customize Magento indexes

### Describe custom product options in Magento


#### The Magento catalog module doesn’t only consist of categories and products: a lot of additional catalog functionality is implemented, partly within the Mage_Catalog module, partly in other modules.

#### When and how are the catalog flat tables updated when a product is modified?

#### Which factors are used by the Mage_Tax module to apply the correct tax rate (or rates) to a product price?

#### How can attributes with custom source models be integrated into layered navigation filtering?

#### Which classes are responsible for rendering the layered navigation?

#### Which indexes are used for the layered navigation?

#### Which steps are needed to integrate a custom indexer into the framework offered by the Mage_Index module?

#### How are custom product options stored on quote and order items?

#### How can you specify custom product options on-the-fly on quote items?

#### How are custom product options copied from quote to order items?

#### How are custom product options processed when a product is added to the cart?

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Catalog_Model_Product_Indexer_Flat][Mage_Catalog_Model_Product_Indexer_Flat]
* [Mage_Catalog_Model_Category_Indexer_Flat][Mage_Catalog_Model_Category_Indexer_Flat]
* [Mage_Catalog_Model_Product_Indexer_Eav][Mage_Catalog_Model_Product_Indexer_Eav]
* [Mage_Catalog_Model_Resource_Product_Indexer_Eav][Mage_Catalog_Model_Resource_Product_Indexer_Eav]
* [Mage_Tax_Helper_Data::_getPrice()][Mage_Tax_Helper_Data::_getPrice]
* [Mage_Catalog_Block_Layer_State][Mage_Catalog_Block_Layer_State]
* [Mage_Catalog_Block_Layer_View][Mage_Catalog_Block_Layer_View]
* [Mage_Catalog_Model_Layer][Mage_Catalog_Model_Layer]

#### Additional Readings

* [Solving Magento: Taxes in Magento Module Mage_Tax][divisionlab.taxes-in-magento-module-mage_tax]




[divisionlab.taxes-in-magento-module-mage_tax]:http://www.divisionlab.com/solvingmagento/taxes-in-magento-module-mage_tax/


[Mage_Catalog_Model_Product_Indexer_Flat]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Model/Product/Indexer/Flat.php
[Mage_Catalog_Model_Category_Indexer_Flat]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Model/Category/Indexer/Flat.php
[Mage_Catalog_Model_Product_Indexer_Eav]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Model/Product/Indexer/Eav.php
[Mage_Catalog_Model_Resource_Product_Indexer_Eav]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Model/Resource/Product/Indexer/Eav.php
[Mage_Tax_Helper_Data::getPrice]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Tax/Helper/Data.php#L488
[Mage_Catalog_Block_Layer_State]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Block/Layer/State.php
[Mage_Catalog_Block_Layer_View]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Block/Layer/View.php
[Mage_Catalog_Model_Layer]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Model/Layer.php
