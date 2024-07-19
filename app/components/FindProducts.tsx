import { useCallback, useState, useEffect } from "react";
import {
  Autocomplete,
  Icon,
  LegacyStack,
  Tag,
  Thumbnail,
} from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";

export default function FindProducts() {
  const paginationInterval = 25;

  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState([]);
  const [deselectedOptions, setDeselectedOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [willLoadMoreResults, setWillLoadMoreResults] = useState(true);
  const [visibleOptionIndex, setVisibleOptionIndex] =
    useState(paginationInterval);

  useEffect(() => {
    fetchProducts("");
  }, []);

  const handleLoadMoreResults = useCallback(() => {
    if (willLoadMoreResults) {
      setIsLoading(true);

      setTimeout(() => {
        const remainingOptionCount = options.length - visibleOptionIndex;
        const nextVisibleOptionIndex =
          remainingOptionCount >= paginationInterval
            ? visibleOptionIndex + paginationInterval
            : visibleOptionIndex + remainingOptionCount;

        setIsLoading(false);
        setVisibleOptionIndex(nextVisibleOptionIndex);

        if (remainingOptionCount <= paginationInterval) {
          setWillLoadMoreResults(false);
        }
      }, 1000);
    }
  }, [willLoadMoreResults, visibleOptionIndex, options.length]);

  const removeTag = useCallback(
    (tag: string) => () => {
      const options = [...selectedOptions];
      options.splice(options.indexOf(tag), 1);
      setSelectedOptions(options);
    },
    [selectedOptions],
  );

  const updateText = useCallback((value: string) => {
    setInputValue(value);
    fetchProducts(value);
  }, []);

  const fetchProducts = async (query: string) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/fetchProducts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const productData = await response.json();

      console.log("Data from Shopify:", productData);
    const newOptions =
      productData?.products.map((product: any) => {
        const mainContent = (
          <div style={{ display: "flex", alignItems: "center" }}>
            <Thumbnail
              source={product.featuredImage?.url || ""}
              alt={product.title}
            />
            <span style={{ marginLeft: "20px" }}>{product.title}</span>
            <span style={{ marginLeft: "100px" }}>
              {product.totalInventory} available
            </span>
            <span style={{ marginLeft: "50px" }}>
              {product.priceRangeV2.maxVariantPrice.amount}
            </span>
          </div>
        );

        
        if (product.variants.edges.length > 1) {
          
          const variantContent = product.variants.edges.map(
            (variantEdge: any, index: number) => (
              <div key={`variant-${index}`}>
                <Thumbnail
                  source={variantEdge.node.image?.url || ""}
                  alt={variantEdge.node.title}
                />
                <span>Variant Title: {variantEdge.node.title}</span>
                <span>Quantity: {variantEdge.node.quantityAvailable}</span>
                <span>Price: {variantEdge.node.price}</span>
              </div>
            ),
          );

          return {
            id: product.id,
            value: product.title,
            label: (
              <div>
                {mainContent}
                {variantContent}
              </div>
            ),
          };
        } else {
          // Render only main content if there are no variants
          return {
            id: product.id,
            value: product.title,
            label: mainContent,
          };
        }
      }) || [];



      setOptions(newOptions);
      setDeselectedOptions(newOptions);
      setVisibleOptionIndex(paginationInterval);
      setWillLoadMoreResults(newOptions.length > paginationInterval);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setOptions([]);
      setDeselectedOptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const textField = (
    <Autocomplete.TextField
      onChange={updateText}
      label="Search Products"
      value={inputValue}
      prefix={<Icon source={SearchIcon} />}
      placeholder="Search Products"
      autoComplete="on"
    />
  );

  const hasSelectedOptions = selectedOptions.length > 0;

  const tagsMarkup = hasSelectedOptions
    ? selectedOptions.map((option) => {
        return (
          <Tag key={`option${option}`} onRemove={removeTag(option)}>
            {option}
          </Tag>
        );
      })
    : null;
  const optionList = options.slice(0, visibleOptionIndex);

  const selectedTagMarkup = hasSelectedOptions ? (
    <LegacyStack spacing="extraTight">{tagsMarkup}</LegacyStack>
  ) : null;

  return (
    <div style={{ width: "100%" }}>
      <LegacyStack vertical>
        {selectedTagMarkup}
        <Autocomplete
          allowMultiple
          options={optionList}
          selected={selectedOptions}
          textField={textField}
          onSelect={setSelectedOptions}
          listTitle="Suggested Products"
          loading={isLoading}
          onLoadMoreResults={handleLoadMoreResults}
          willLoadMoreResults={willLoadMoreResults}
        />
      </LegacyStack>
    </div>
  );
}
