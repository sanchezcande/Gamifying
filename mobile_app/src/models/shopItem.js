export function mapShopItem(item) {
  return {
    id: item?.id,
    name: item?.name,
    description: item?.description,
    type: item?.type,
    category: item?.category,
    gcCost: item?.gcCost,
    effectDurationDays: item?.effectDurationDays
  };
}
