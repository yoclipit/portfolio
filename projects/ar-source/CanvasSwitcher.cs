using UnityEngine;

public class CanvasSwitcher : MonoBehaviour
{
    public GameObject frontPageCanvas;
    public GameObject productGalleryCanvas;
    public GameObject productDetailsCanvas;

    public GameObject arObjects;

    public AudioSource backgroundMusic;

    public void ShowFrontPage()
    {
        frontPageCanvas.SetActive(true);
        productGalleryCanvas.SetActive(false);
        productDetailsCanvas.SetActive(false);

        arObjects.SetActive(false);
        ARProductPlacer.ClearSpawnedProduct();

        if (backgroundMusic != null && !backgroundMusic.isPlaying)
            backgroundMusic.Play();
    }

    public void ShowProductGallery()
    {
        frontPageCanvas.SetActive(false);
        productGalleryCanvas.SetActive(true);
        productDetailsCanvas.SetActive(false);

        arObjects.SetActive(false);
        ARProductPlacer.ClearSpawnedProduct();

        if (backgroundMusic != null && !backgroundMusic.isPlaying)
            backgroundMusic.Play();
    }

    public void ShowProductDetails()
    {
        frontPageCanvas.SetActive(false);
        productGalleryCanvas.SetActive(false);
        productDetailsCanvas.SetActive(true);

        arObjects.SetActive(true);

        if (backgroundMusic != null)
            backgroundMusic.Stop();
    }
}