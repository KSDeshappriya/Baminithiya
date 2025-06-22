import torch
import torchvision.transforms as transforms
from torchvision.models import efficientnet_b2
from PIL import Image
from ultralytics import YOLO
from io import BytesIO

class DisasterModel(torch.nn.Module):
    def __init__(self):
        super().__init__()
        self.backbone = efficientnet_b2(weights=None)
        self.backbone.classifier = torch.nn.Sequential(
            torch.nn.Dropout(0.3),
            torch.nn.Linear(1408, 512),
            torch.nn.ReLU(),
            torch.nn.BatchNorm1d(512),
            torch.nn.Dropout(0.2),
            torch.nn.Linear(512, 256),
            torch.nn.ReLU(),
            torch.nn.BatchNorm1d(256),
            torch.nn.Dropout(0.1),
            torch.nn.Linear(256, 4)
        )

    def forward(self, x):
        return self.backbone(x)

def load_disaster_model(path, device):
    model = DisasterModel().to(device)
    ckpt = torch.load(path, map_location=device)
    model.load_state_dict(ckpt['model_state_dict'])
    model.eval()
    return model

def load_yolo_model():
    return YOLO('../../model_weight/yolo.pt')

def analyze_image_with_summary(image_input, disaster_model, yolo_model, device):
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406],
                             [0.229, 0.224, 0.225])
    ])
    classes = ['earthquake', 'fire', 'flood', 'normal']

    if isinstance(image_input, BytesIO):
        image = Image.open(image_input).convert('RGB')
    elif isinstance(image_input, Image.Image):
        image = image_input.convert('RGB')
    else:
        raise TypeError("image_input must be a PIL.Image or BytesIO object")

    input_tensor = transform(image).unsqueeze(0).to(device)
    with torch.no_grad():
        pred = torch.nn.functional.softmax(disaster_model(input_tensor), dim=1)
    disaster = classes[torch.argmax(pred)]
    conf = torch.max(pred).item()

    results = yolo_model(image, conf=0.4, verbose=False)
    people = sum(1 for r in results for b in r.boxes if int(b.cls) == 0)

    return f"The image likely shows a {disaster.upper()} scene with {people} {'people' if people != 1 else 'person'} detected. (Confidence: {conf*100:.1f}%)"

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
disaster_model = load_disaster_model('./model_weight/cnn_model.pth', device)
yolo_model = load_yolo_model()