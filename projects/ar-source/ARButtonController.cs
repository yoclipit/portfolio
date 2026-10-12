using UnityEngine;

public class ARButtonController : MonoBehaviour
{
    public CanvasSwitcher canvasSwitcher;

    public void FeatureOne()
    {
        ProductFeatureController controller = GetCurrentProduct();

        if (controller != null)
            controller.UseFeatureOne();
    }

    public void FeatureTwo()
    {
        ProductFeatureController controller = GetCurrentProduct();

        if (controller != null)
            controller.UseFeatureTwo();
    }

    ProductFeatureController GetCurrentProduct()
    {
        if (ARProductPlacer.spawnedProduct != null)
        {
            return ARProductPlacer.spawnedProduct.GetComponentInChildren<ProductFeatureController>();
        }

        return FindObjectOfType<ProductFeatureController>();
    }

    public void BackToGallery()
    {
        ARProductPlacer.ClearSpawnedProduct();

        if (canvasSwitcher != null)
            canvasSwitcher.ShowProductGallery();
    }
}