---
layout: post
title:  Magento Developer Certification Catalog and Price Generation
date:   2016-11-26 15:00:00
categories: Magento
---

Notes about `Magento Developer Certification Catalog and Price Generation`.


7- Catalog
===========

Price Generation
-----------

### Identify basic concepts of price generation in Magento

### Modify and adjust price generation for products (for example, during integration of third-party software):

#### Under what circumstances are product prices read from the index tables?

The product price is read from the index tables when they are in a product collection.

#### From which modules do classes participate in price calculation?

#### Which ways exist to specify custom prices during runtime?

#### How do custom product options influence price calculation?

#### How are product tier prices implemented and displayed?

#### What is the priority of the different prices that can be specified for products (price, special price, group price, tier price, etc.)?

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Catalog_Model_Product::getPrice()][Mage_Catalog_Model_Product::getPrice] and [getFinalPrice()][Mage_Catalog_Model_Product::getFinalPrice]
* [Mage_Catalog_Model_Product_Type_Price::getTierPrice()][Mage_Catalog_Model_Product_Type_Price::getTierPrice]
* [Mage_Catalog_Model_Product_Indexer_Price][Mage_Catalog_Model_Product_Indexer_Price]
* [Mage_Catalog_Model_Product_Type_Configurable_Price][Mage_Catalog_Model_Product_Type_Configurable_Price]





[Mage_Catalog_Model_Product::getPrice]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Model/Product.php#L209
[Mage_Catalog_Model_Product::getFinalPrice]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Model/Product.php#L706
[Mage_Catalog_Model_Product_Type_Price::getTierPrice]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Model/Product/Type/Price.php#L178
[Mage_Catalog_Model_Product_Indexer_Price]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Model/Product/Indexer/Price.php
[Mage_Catalog_Model_Product_Type_Configurable_Price]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Model/Product/Type/Configurable/Price.php
