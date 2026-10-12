using UnityEngine;

public class ProductFeatureController : MonoBehaviour
{
    public Renderer objectRenderer;
    public AudioSource objectAudio;
    public GameObject infoCanvas;
    public ParticleSystem crownParticles;

    private bool audioOn = false;

    void Start()
    {
        if (infoCanvas != null)
            infoCanvas.SetActive(false);

        if (crownParticles != null)
            crownParticles.Stop();
    }

    void Update()
    {
        if (infoCanvas != null && infoCanvas.activeSelf && Camera.main != null)
        {
            infoCanvas.transform.LookAt(Camera.main.transform);
            infoCanvas.transform.Rotate(0, 180, 0);
        }
    }

    public void UseFeatureOne()
    {
        string selectedProduct = PlayerPrefs.GetString("SelectedProduct");

        if (selectedProduct == "Pan") ChangeColor();
        else if (selectedProduct == "Hammer") RotateObject();
        else if (selectedProduct == "Crown") ToggleCrownParticles();
        else if (selectedProduct == "Wheel") RepositionObject();
    }

    public void UseFeatureTwo()
    {
        string selectedProduct = PlayerPrefs.GetString("SelectedProduct");

        if (selectedProduct == "Pan") TogglePanVisibility();
        else if (selectedProduct == "Hammer") ToggleInfoBox();
        else if (selectedProduct == "Crown") ResizeObject();
        else if (selectedProduct == "Wheel") ToggleAudio();
    }

    void ChangeColor()
    {
        if (objectRenderer != null)
            objectRenderer.material.color = Random.ColorHSV();
    }

    void RotateObject()
    {
        transform.Rotate(0, 45, 0);
    }

    void ResizeObject()
    {
        transform.localScale += new Vector3(0.1f, 0.1f, 0.1f);

        if (transform.localScale.x > 1.5f)
            transform.localScale = Vector3.one * 0.5f;
    }

    void TogglePanVisibility()
    {
        if (objectRenderer == null) return;

        objectRenderer.enabled = !objectRenderer.enabled;
    }

    void ToggleCrownParticles()
    {
        if (crownParticles == null) return;

        if (crownParticles.isPlaying)
            crownParticles.Stop();
        else
            crownParticles.Play();
    }

    void RepositionObject()
    {
        if (Camera.main == null) return;

        float distance = 1.2f;

        Vector3 newPosition =
            Camera.main.transform.position +
            Camera.main.transform.forward * distance;

        
        newPosition.y = transform.position.y;

        transform.position = newPosition;
    }

    void ToggleAudio()
    {
        if (objectAudio == null) return;

        audioOn = !audioOn;

        if (audioOn) objectAudio.Play();
        else objectAudio.Stop();
    }

    void ToggleInfoBox()
    {
        if (infoCanvas == null) return;

        infoCanvas.SetActive(!infoCanvas.activeSelf);
    }
}