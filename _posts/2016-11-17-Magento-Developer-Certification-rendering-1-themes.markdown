---
layout: post
title:  Magento Developer Certification Rendering and Themes in Magento
date:   2016-11-17 18:00:00
categories: Magento
---

Notes about `Magento Developer Certification Rendering and Themes in Magento`.

3 - Rendering
====================

Themes in Magento
--------------------

### Define and describe the use of themes in Magento:

`Themes` in Magento enables us to change the `frontend` of the store. Different stores in the same Magento installation can have different design. We can also use themes to change the design of an individual category or product.

Magentos `themes` are divided into two parts. The `templates`, translations and `xml` in `app/design/[design-area]/[package]/[theme]` and the `css`, `js` and images in `skin/[area]/[package]/[theme]`.

The Magento fallback system allows `themes` to inherit from other `themes`. This enables us to override files without changing the originals.

#### How you can use themes to customize core functionality?

When creating our own `theme` we can override templates in the `base` `theme` (or other `themes` the current `theme` inherits from). To to this we use the same path as the `base` `default` `theme`.

* `app/design/base/default/template/email/order/items.phtml`
* `app/design/{packagename}/{themename}/template/email/order/items.phtml`

We can also override `xml` files.

* `app/design/base/default/layout/cms.xml`
* `app/design/{packagename}/{themename}/layout/cms.xml`

When overriding `xml` it is better to add a `local.xml` file to the `theme`. This file is loaded last and will take precedence over any other `xml` file in the `theme`.

We can override `css` or other `skin` files the same way. We mimic the path in our custom theme and Magento will use the new files instead.

* `skin/frontend/base/default/css/some.css`
* `skin/frontend/{packagename}/{themename}/css/some.css`

#### How can you implement different designs for different stores using Magento themes?

In `app/design/frontend/` we can add a new `package`.
In our `package` we can add our new `themes`.

#### In which two ways you can register custom theme?

We can set different `themes` on different stores in Magentos admin.

* `System > Config > General > Design > Package > Current Package Name > {packagename}`
* `Themes > Default > {themename} (will default to the default theme)`

Also in the admin we can select a temporary `theme` where we can select from and to dates.

* `System > Design`

We can add a custom `theme` to a specific `category`. Here we can also select from and to dates.

* `Catalog > Category > [Category] > Custom Design > Custom Design`

We can also use a custom `theme` on selected `products` and we can also select from and to dates.

* `Catalog > Manage Products > [Product] > Design > Custom Design`

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Core_Model_Layout][Mage_Core_Model_Layout]
* [Mage_Core_Model_Layout_Update][Mage_Core_Model_Layout_Update]
* [Mage_Core_Model_Design][Mage_Core_Model_Design]
* [Mage_Core_Model_Design_Package][Mage_Core_Model_Design_Package]

### Define and describe the use of design packages:

The design `package` is a container for a family of `themes`. Each `package` should have a `default` `theme`. In the `default` `theme` we would have design changes that applies to all `themes`. Each additional `theme` will have their own additional changes and inherit the changes from the `default` `theme`.

#### What is the difference between package and theme?

A `package` can contain several `themes` but a `theme` can only belong to one `package`.

#### What happens if the requested file is missed in your theme/package?

* Magento will look in the custom `theme`.
* Magento will search for the file in the `default` `theme` of the `package`.
* Magento will look in `base` `default`.
* Magento throws an error.

As of Magento 1.9 there is `Infinite Theme Fallback` and we can add more themes to check before Magento throws an error.

#### These code references can be used as an entry point to find answers to the questions
above:

* [Mage_Core_Model_Layout][Mage_Core_Model_Layout]
* [Mage_Core_Model_Layout_Update][Mage_Core_Model_Layout_Update]
* [Mage_Core_Model_Design][Mage_Core_Model_Design]
* [Mage_Core_Model_Design_Package][Mage_Core_Model_Design_Package]
* [Mage_Core_Block_Template][Mage_Core_Block_Template]

### Describe the process of defining template file paths:

We use template file paths to override or add templates. If we create a new `theme` and add a file with the same file path as an existing file the old file will be overriden.

* `app/design/{packagename}/{themename}/template/email/order/items.phtml`

Magento will use the fallback method to find the files needed and use the first one found.

#### Which kind of paths (absolute or relative) does Magento use for templates and layout files?

Magento use relative paths for `template` and `layout` files. Since the file can be located anywhere in the `theme` fallback hierarchy Magento only stores the part after the `themename`.

`app/design/{packagename}/{themename}/template/email/order/items.phtml`
`app/design/{packagename}/{themename}/layout/cms.xml`

#### How exactly can Magento define which physical file correspond to certain template/layout to use?

[Mage_Core_Model_Design_Package::getFilename()][Mage_Core_Model_Design_Package::getFilename]

{% highlight php %}
<?php
class Mage_Core_Model_Design_Package
{
    const DEFAULT_AREA    = 'frontend';
    const DEFAULT_PACKAGE = 'default';
    const DEFAULT_THEME   = 'default';
    const BASE_PACKAGE    = 'base';

    public function getFilename($file, array $params)
    {
        Varien_Profiler::start(__METHOD__);
        $this->updateParamDefaults($params);
        $result = $this->_fallback(
            $file,
            $params,
            $this->_fallback->getFallbackScheme(
                $params['_area'],
                $params['_package'],
                $params['_theme']
            )
        );
        Varien_Profiler::stop(__METHOD__);
        return $result;
    }
}
{% endhighlight %}

* [Mage_Core_Model_Design_Package][Mage_Core_Model_Design_Package]
* [Mage_Core_Model_Design_Package::getFilename()][Mage_Core_Model_Design_Package::getFilename]

#### Which classes and methods need to be rewritten in order to add additional directories to the fallback list?

[Mage_Core_Model_Design_Package::getFilename()][Mage_Core_Model_Design_Package::getFilename]

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Core_Model_Design][Mage_Core_Model_Design]
* [Mage_Core_Model_Design_Package][Mage_Core_Model_Design_Package]
* [Mage_Core_Block_Template][Mage_Core_Block_Template]

#### Additional Readings



[Mage_Core_Model_Layout]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Layout.php
[Mage_Core_Model_Layout_Update]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Layout/Update.php
[Mage_Core_Model_Design]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Design.php
[Mage_Core_Model_Design_Package]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Design/Package.php
[Mage_Core_Model_Design_Package::getFilename]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Design/Package.php#L440
[Mage_Core_Block_Template]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Block/Template.php
