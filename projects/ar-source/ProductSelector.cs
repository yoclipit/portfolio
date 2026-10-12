using UnityEngine;

public class ProductSelector : MonoBehaviour
{
    public CanvasSwitcher canvasSwitcher;
    public ARProductPlacer arProductPlacer;

    public void SelectPan()
    {
        ARProductPlacer.ClearSpawnedProduct();
        PlayerPrefs.SetString("SelectedProduct", "Pan");
        canvasSwitcher.ShowProductDetails();
        arProductPlacer.ShowPlanes();
    }

    public void SelectHammer()
    {
        ARProductPlacer.ClearSpawnedProduct();
        PlayerPrefs.SetString("SelectedProduct", "Hammer");
        canvasSwitcher.ShowProductDetails();
        arProductPlacer.ShowPlanes();
    }

    public void SelectCrown()
    {
        ARProductPlacer.ClearSpawnedProduct();
        PlayerPrefs.SetString("SelectedProduct", "Crown");
        canvasSwitcher.ShowProductDetails();
        arProductPlacer.ShowPlanes();
    }

    public void SelectWheel()
    {
        ARProductPlacer.ClearSpawnedProduct();
        PlayerPrefs.SetString("SelectedProduct", "Wheel");
        canvasSwitcher.ShowProductDetails();
        arProductPlacer.ShowPlanes();
    }

    public void BackToFrontPage()
    {
        ARProductPlacer.ClearSpawnedProduct();
        canvasSwitcher.ShowFrontPage();
    }
}