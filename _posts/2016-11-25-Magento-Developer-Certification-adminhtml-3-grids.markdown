---
layout: post
title:  Magento Developer Certification Adminhtml and Grids in Magento
date:   2016-11-24 15:00:00
categories: Magento
---

Notes about `Magento Developer Certification Adminhtml and Grids in Magento`.

6 - Adminhtml
====================

Grids in Magento
--------------------


### Create a simple form and grid for a custom entity

### Describe how to implement advanced Adminhtml Grids and Forms, including editable cells, mass actions, totals, reports, custom filters and renderers, multiple grids on one page, combining grids with forms, and adding custom JavaScript to an admin form:

#### Which block class do Magento grid classes typically extend?

#### What is the default template for Magento grid instances?

#### How can grid filters be customized?

#### How does Magento actually perform sorting/paging/filtering operations?

#### What protected methods are specific to adminhtml grids, and how are they used?

#### What is the standard column class in a grid, and what is its role?

#### What are column renderers used for in Magento?

#### How can JavaScript that is used for a Magento grid be customized?

#### What is the role of the grid container class and its template?

#### What is the programmatic structure of mass actions?

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Adminhtml_Block_Widget_Grid][Mage_Adminhtml_Block_Widget_Grid]
* [Mage_Adminhtml_Block_Widget_Grid_Column][Mage_Adminhtml_Block_Widget_Grid_Column]
* [Mage_Adminhtml_Block_Widget_Grid_Column_Renderer/*][Mage_Adminhtml_Block_Widget_Grid_Column_Renderer/*]
* [Mage_Adminhtml_Block_Widget_Grid_Column_Filter/*][Mage_Adminhtml_Block_Widget_Grid_Column_Filter/*]
* [Mage_Adminhtml_Block_Widget_Grid_Container][Mage_Adminhtml_Block_Widget_Grid_Container]
* [app/design/adminhtml/default/default/template/widget/grid.phtml][app/design/adminhtml/default/default/template/widget/grid.phtml]
* [app/design/adminhtml/default/default/template/widget/grid/container.phtml][app/design/adminhtml/default/default/template/widget/grid/container.phtml]


#### Additional Readings




[Mage_Adminhtml_Block_Widget_Grid]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Adminhtml/Block/Widget/Grid.php
[Mage_Adminhtml_Block_Widget_Grid_Column]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Adminhtml/Block/Widget/Grid/Column.php
[Mage_Adminhtml_Block_Widget_Grid_Column_Renderer/*]:https://github.com/AndersWik/Magento-1x/tree/master/app/code/core/Mage/Adminhtml/Block/Widget/Grid/Column/Renderer
[Mage_Adminhtml_Block_Widget_Grid_Column_Filter/*]:https://github.com/AndersWik/Magento-1x/tree/master/app/code/core/Mage/Adminhtml/Block/Widget/Grid/Column/Filter
[Mage_Adminhtml_Block_Widget_Grid_Container]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Adminhtml/Block/Widget/Grid/Container.php
[app/design/adminhtml/default/default/template/widget/grid.phtml]:https://github.com/AndersWik/Magento-1x/blob/master/app/design/adminhtml/default/default/template/widget/grid.phtml
[app/design/adminhtml/default/default/template/widget/grid/container.phtml]:https://github.com/AndersWik/Magento-1x/blob/master/app/design/adminhtml/default/default/template/widget/grid/container.phtml
