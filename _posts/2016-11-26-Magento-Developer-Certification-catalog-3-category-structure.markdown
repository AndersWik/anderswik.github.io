---
layout: post
title:  Magento Developer Certification Catalog and Category Structure
date:   2016-11-26 15:00:00
categories: Magento
---

Notes about `Magento Developer Certification Catalog and Category Structure`.

7- Catalog
===========

Category Structure
------------------

### Describe the Category Hierarchy Tree Structure implementation (the internal structure inside the database), including:

`catalog_category_entity`

|  entity_id | entity_type_id |  attribute_set_id | parent_id           | created_at     | updated_at  | path      | position | level     | children_count |
|------------|----------------|-------------------|---------------------|----------------|-------------|-----------|----------|-----------|----------------|
|  Entity ID | Entity Type ID |  Attriute Set ID  | Parent Category ID  | Creation Time  | Update Time | Tree Path | Position | Tree Level| Child Count    |


#### The meaning of parent_id 0

`parent_id 0` is the base category. root category

#### The construction of paths

This is the `path` to the category with ids seperated with a slash (`/`).

#### The attributes required to display a new category in the store

* url_key
* name
* all_children
* is_anchor
* position
* is_active

#### Questions to ask yourself:

#### How is the category hierarchy reflected in the database? Does it differ when multiple root categories are present?

The category hierarchy are in the path column of the catalog_category_entity. The `path` column is category ids seperated with a slash (`/`). This does not differ with multiple root categories.

#### How is a catalog tree read from the database tables, with and without flat catalog tables enabled?

* [Mage_Catalog_Model_Resource_Category_Tree][Mage_Catalog_Model_Resource_Category_Tree]
* [Mage_Catalog_Model_Resource_Category_Flat][Mage_Catalog_Model_Resource_Category_Flat]


#### How does working with categories differ if the flat catalog is enabled on a model level?

#### How is the category parent id path set on new categories?

[Mage_Catalog_Model_Resource_Category::_beforeSave()][Mage_Catalog_Model_Resource_Category::_beforeSave]

#### Which methods exist to read category children and how do they differ?

* [Mage_Catalog_Model_Resource_Category::getChildren()][Mage_Catalog_Model_Resource_Category::getChildren]
* [Mage_Catalog_Model_Resource_Category::getAllChildren()][Mage_Catalog_Model_Resource_Category::getAllChildren]
* [Mage_Catalog_Model_Resource_Category::_getChildrenCategoriesBase()][Mage_Catalog_Model_Resource_Category::_getChildrenCategoriesBase]

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Catalog_Model_Category][Mage_Catalog_Model_Category]
* [Mage_Catalog_Model_Resource_Category][Mage_Catalog_Model_Resource_Category]
* [Mage_Catalog_Model_Resource_Category_Collection][Mage_Catalog_Model_Resource_Category_Collection]
* [Mage_Catalog_Model_Resource_Category_Tree][Mage_Catalog_Model_Resource_Category_Tree]




[Mage_Catalog_Model_Category]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Model/Category.php
[Mage_Catalog_Model_Resource_Category::_beforeSave]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Model/Resource/Category.php#L184
[Mage_Catalog_Model_Resource_Category]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Model/Resource/Category.php
[Mage_Catalog_Model_Resource_Category_Collection]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Model/Resource/Category/Collection.php
[Mage_Catalog_Model_Resource_Category_Tree]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Model/Resource/Category/Tree.php
[Mage_Catalog_Model_Resource_Category_Flat]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Model/Resource/Category/Flat.php
[Mage_Catalog_Model_Resource_Category::getChildren]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Model/Resource/Category.php#L707
[Mage_Catalog_Model_Resource_Category::getAllChildren]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Model/Resource/Category.php#L754
[Mage_Catalog_Model_Resource_Category::_getChildrenCategoriesBase]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Model/Resource/Category.php#L635
