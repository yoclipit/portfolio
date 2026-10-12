using System.Collections.Generic;
using UnityEngine;
using UnityEngine.XR.ARFoundation;
using UnityEngine.XR.ARSubsystems;

public class ARProductPlacer : MonoBehaviour
{
    public GameObject panPrefab;
    public GameObject hammerPrefab;
    public GameObject crownPrefab;
    public GameObject wheelPrefab;
    public ARPlaneManager planeManager;

    private GameObject selectedPrefab;
    public static GameObject spawnedProduct;

    private ARRaycastManager raycastManager;
    private static List<ARRaycastHit> hits = new List<ARRaycastHit>();

    void Start()
    {
        raycastManager = GetComponent<ARRaycastManager>();
    }

    void Update()
    {
        if (Input.touchCount == 0) return;

        Touch touch = Input.GetTouch(0);
        if (touch.phase != TouchPhase.Began) return;

        string selectedProduct = PlayerPrefs.GetString("SelectedProduct");

        if (selectedProduct == "Pan") selectedPrefab = panPrefab;
        else if (selectedProduct == "Hammer") selectedPrefab = hammerPrefab;
        else if (selectedProduct == "Crown") selectedPrefab = crownPrefab;
        else if (selectedProduct == "Wheel") selectedPrefab = wheelPrefab;

        if (selectedPrefab == null) return;

        if (raycastManager.Raycast(touch.position, hits, TrackableType.PlaneWithinPolygon))
        {
            Pose hitPose = hits[0].pose;

            ClearSpawnedProduct();

            GameObject anchor = new GameObject("PlacedProductAnchor");
            anchor.transform.position = hitPose.position;

            if (Camera.main != null)
            {
                anchor.transform.rotation =
                    Quaternion.Euler(0, Camera.main.transform.eulerAngles.y, 0);
            }

            spawnedProduct = Instantiate(selectedPrefab, anchor.transform);
            spawnedProduct.transform.localPosition = Vector3.zero;
            spawnedProduct.transform.localRotation = Quaternion.identity;
            spawnedProduct.transform.localScale = Vector3.one * 0.2f;

            DisablePhysics(spawnedProduct);
            HidePlanes();
        }
    }

    void DisablePhysics(GameObject obj)
    {
        Rigidbody[] rigidbodies = obj.GetComponentsInChildren<Rigidbody>();

        foreach (Rigidbody rb in rigidbodies)
        {
            rb.useGravity = false;
            rb.isKinematic = true;
        }
    }

    void HidePlanes()
    {
        if (planeManager == null) return;

        foreach (ARPlane plane in planeManager.trackables)
        {
            plane.gameObject.SetActive(false);
        }

        planeManager.enabled = false;
    }

    public void ShowPlanes()
    {
        if (planeManager == null) return;

        planeManager.enabled = true;

        foreach (ARPlane plane in planeManager.trackables)
        {
            plane.gameObject.SetActive(true);
        }
    }

    public static void ClearSpawnedProduct()
    {
        if (spawnedProduct != null)
        {
            if (spawnedProduct.transform.parent != null)
                Destroy(spawnedProduct.transform.parent.gameObject);
            else
                Destroy(spawnedProduct);

            spawnedProduct = null;
        }
    }
}