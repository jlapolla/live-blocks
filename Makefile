define $(d)template
$(eval include helpdoc.mk)
$(eval include watch.mk)
$(eval $(d)cat_order := $(d)iife/header.js)
$(eval $(d)cat_order += $(d)classes/getUndefined.js)
$(eval $(d)cat_order += $(d)classes/extendClass.js)
$(eval $(d)cat_order += $(d)classes/hasOwnProperty.js)
$(eval $(d)cat_order += $(d)classes/multiInheritClass.js)
$(eval $(d)cat_order += $(d)classes/ArrayIterator.js)
$(eval $(d)cat_order += $(d)classes/Queue.js)
$(eval $(d)cat_order += $(d)classes/Set.js)
$(eval $(d)cat_order += $(d)classes/Map.js)
$(eval $(d)cat_order += $(d)classes/Subject.js)
$(eval $(d)cat_order += $(d)classes/EventEmitter.js)
$(eval $(d)cat_order += $(d)classes/Block.js)
$(eval $(d)cat_order += $(d)classes/Wire.js)
$(eval $(d)cat_order += $(d)classes/WireConstraint.js)
$(eval $(d)cat_order += $(d)classes/BlackBox.js)
$(eval $(d)cat_order += $(d)iife/footer.js)

$(d)live-blocks.js: $(wildcard $(d)classes/*) $(wildcard $(d)iife/*)
	cat $($(d)cat_order) >$(d)live-blocks.js

.PHONY: $(d)all
$(call helpdoc,$(d)all)
$(d)all: $(d)live-blocks.js

.PHONY: $(d)test
$(call helpdoc,$(d)test,Start Karma test runner)
$(d)test: $(d)karma $(d)live-blocks.js
	$(if $(d),(cd $(d) && ./karma start),./karma start)

$(d)karma: $(d)node_modules/karma/bin/karma
	ln -sf $(d)node_modules/karma/bin/karma $(d)karma

$(d)node_modules/karma/bin/karma:
	$(if $(d),(cd $(d) && npm install),npm install)

$(eval $(d)cat_order :=)

.DEFAULT_GOAL := help

endef

$(eval $($(d)template))
$(eval $(d)template :=)
