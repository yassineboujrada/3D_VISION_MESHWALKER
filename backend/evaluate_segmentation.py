import os, copy, json, sys
from easydict import EasyDict
from tqdm import tqdm

import scipy
import numpy as np
import trimesh

import tensorflow as tf

import rnn_model
import dataset
import dataset_prepare
import utils


def fill_edges(model):
  # To compare accuracies to MeshCNN, this function build edges & edges length in the same way they do
  edge2key = dict()
  edges_length = []
  edges = []
  edges_count = 0
  for face_id, face in enumerate(model['faces']):
    faces_edges = []
    for i in range(3):
      cur_edge = (face[i], face[(i + 1) % 3])
      faces_edges.append(cur_edge)
    for idx, edge in enumerate(faces_edges):
      edge = tuple(sorted(list(edge)))
      faces_edges[idx] = edge
      if edge not in edge2key:
        edge2key[edge] = edges_count
        edges.append(list(edge))
        e_l = np.linalg.norm(model['vertices'][edge[0]] - model['vertices'][edge[1]])
        edges_length.append(e_l)
        edges_count += 1
  model['edges_meshcnn'] = np.array(edges)
  model['edges_length'] = edges_length


def get_model_by_name(name):
  fn = name[name.find(':')+1:]
  mesh_data = np.load(fn, encoding='latin1', allow_pickle=True)
  model = {'vertices': mesh_data['vertices'], 'faces': mesh_data['faces'], 'labels': mesh_data['labels'],
           'edges': mesh_data['edges']}

  if 'face_labels' in mesh_data.keys():
     model['face_labels'] = mesh_data['face_labels']

  if 'labels_fuzzy' in mesh_data.keys():
    model['labels_fuzzy'] = mesh_data['labels_fuzzy']
    fill_edges(model)
    model['seseg'] = np.zeros((model['edges_meshcnn'].shape[0], model['labels_fuzzy'].shape[1]))
    for e in range(model['edges_meshcnn'].shape[0]):
      v0, v1 = model['edges_meshcnn'][e]
      l0 = model['labels_fuzzy'][v0]
      l1 = model['labels_fuzzy'][v1]
      model['seseg'][e] = (l0 + l1) / 2

  return model


def calc_final_accuracy(models, print_details=False):
  # Calculating 4 types of accuracy.
  # 2 alternatives for element used (vertex / edge) and for each element, vanilla accuracy and normalized one.
  # Notes:
  # 1. For edge calculation only, the accuracy allow fuzzy labeling:
  #    like MeshCNN's paper, if an edge is inbetween two different segments, any prediction from the two is considered good.
  # 2. Normalized accuracy is calculated using the edge length or vertex "area" (which is the mean faces area for each vertex).
  vertices_accuracy = []; vertices_norm_acc = []
  edges_accuracy = []; edges_norm_acc = []
  segmentation = []
  segmentation__ = {}
  for model_name, model in models.items():
    if model['labels'].size == 0:
      continue
    best_pred = np.argmax(model['pred'], axis=-1)
    model['v_pred'] = best_pred
    pred_score = scipy.special.softmax(model['pred'], axis=1)
    # Calc edges accuracy
    # if 'edges_meshcnn' in model.keys(): # pred per edge
    g = 0
    gn = 0
    for fi, face in enumerate(model['faces']):
      v0_pred = best_pred[face[0]]
      v1_pred = best_pred[face[1]]
      v2_pred = best_pred[face[2]]
      prediction_per_vertice = [(face[0], v0_pred), (face[1], v1_pred), (face[2], v2_pred)]
      all_predictions = [v0_pred, v1_pred, v2_pred]
      # print("prediction_per_vertice",prediction_per_vertice)
      if len(set(all_predictions)) == 3:
          segmentation__[fi] = int(sorted(prediction_per_vertice, key = lambda x : pred_score[x[0], x[1]], reverse = True)[0][1])
          segmentation.append(int(sorted(prediction_per_vertice, key = lambda x : pred_score[x[0], x[1]], reverse = True)[0][1]))
      else:
          segmentation__[fi] = int(sorted(all_predictions, key = lambda x : all_predictions.count(x), reverse = True)[0])
          segmentation.append(int(sorted(all_predictions, key = lambda x : all_predictions.count(x), reverse = True)[0])) 
            
        
    if 'edges_meshcnn' in model.keys():    
      for ei, edge in enumerate(model['edges_meshcnn']):
        v0_pred = best_pred[edge[0]]
        v0_score = pred_score[edge[0], v0_pred]
        v1_pred = best_pred[edge[1]]
        v1_score = pred_score[edge[1], v1_pred]
        if v0_score > v1_score:
          best = v0_pred - 1
          segmentation[str(tuple(edge))] = int(v0_pred)
        else:
          best = v1_pred - 1
          segmentation[str(tuple(edge))] = int(v1_pred)
        if best < model['seseg'].shape[1]:
          g  += (model['seseg'][ei, best] != 0)
          gn += (model['seseg'][ei, best] != 0) * model['edges_length'][ei]
      this_accuracy = g / model['edges_meshcnn'].shape[0]
      norm_accuracy = gn / np.sum(model['edges_length'])
      edges_accuracy.append(this_accuracy)
      edges_norm_acc.append(norm_accuracy)

    # Calc vertices accuracy
    if 'area_vertices' not in model.keys():
      dataset_prepare.calc_mesh_area(model)
    # print("model['labels']",model['labels'],"\n",best_pred,"\n")
    # this_accuracy = (best_pred == model['labels']).sum() / model['labels'].shape[0]
    # norm_accuracy = np.sum((best_pred == model['labels']) * model['area_vertices']) / model['area_vertices'].sum()
    # vertices_accuracy.append(this_accuracy)
    # vertices_norm_acc.append(norm_accuracy)

  # if len(edges_accuracy) == 0:
  #   edges_accuracy = [0]
  with open('segmentation.json', 'w+') as f:
    json.dump(segmentation__, f, indent=4)
  print("hi ",model['v_pred'])
  print("hi2",segmentation__)
  return np.mean([1,2,3,4]), np.mean([5,4,6,3]), np.nan,segmentation__


def postprocess_vertex_predictions(models):
  # Averaging vertices with thir neighbors, to get best prediction (eg.5 in the paper)
  for model_name, model in models.items():
    pred_orig = model['pred'].copy()
    av_pred = np.zeros_like(pred_orig)
    for v in range(model['vertices'].shape[0]):
      this_pred = pred_orig[v]
      nbrs_ids = model['edges'][v]
      nbrs_ids = np.array([n for n in nbrs_ids if n != -1])
      if nbrs_ids.size:
        first_ring_pred = (pred_orig[nbrs_ids].T / model['pred_count'][nbrs_ids]).T
        nbrs_pred = np.mean(first_ring_pred, axis=0) * 0.5
        av_pred[v] = this_pred + nbrs_pred
      else:
        av_pred[v] = this_pred
    model['pred'] = av_pred


def calc_accuracy_test(logdir=None, dataset_expansion=None, dnn_model=None, params=None,
                       n_iters=32, model_fn=None, n_walks_per_model=32, data_augmentation={}, file_path=None):
  # Prepare parameters for the evaluation
  if params is None:
    with open(logdir + '/params.txt') as fp:
      params = EasyDict(json.load(fp))
    params.model_fn = logdir + '/learned_model.keras'
    params.new_run = 0
  else:
    params = copy.deepcopy(params)
  if logdir is not None:
    params.logdir = logdir
  params.mix_models_in_minibatch = False
  params.batch_size = 1
  params.net_input.append('vertex_indices')
  params.n_walks_per_model = n_walks_per_model

  # Prepare the dataset
  test_dataset, n_items = dataset.tf_mesh_dataset(params, dataset_expansion, mode=params.network_task,
                                                  shuffle_size=0, size_limit=np.inf, permute_file_names=False,
                                                  must_run_on_all=True, data_augmentation=data_augmentation)

  # If dnn_model is not provided, load it
  if dnn_model is None:
    dnn_model = rnn_model.RnnWalkNet(params, params.n_classes, params.net_input_dim - 1, model_fn, model_must_be_load=True,
                                       dump_model_visualization=False)

  # Skip the 1st half of the walk to get the vertices predictions that are more reliable
  skip = int(params.seq_len * 0.5)
  models = {}

  npz_path = file_path
  model_name = os.path.basename(npz_path)
  models[model_name] = get_model_by_name(npz_path)
  models[model_name]['pred'] = np.zeros((models[model_name]['vertices'].shape[0], params.n_classes))
  models[model_name]['pred_count'] = 1e-6 * np.ones((models[model_name]['vertices'].shape[0], ))


  # Go through the dataset n_iters times
  for _ in tqdm(range(1)):
    for name_, model_ftrs_, labels_ in test_dataset:
      # name = name_.numpy()[0].decode()
      # assert name_.shape[0] == 1
      model_ftrs = model_ftrs_[:, :, :, :-1]
      all_seq = model_ftrs_[:, :, :, -1].numpy()
      # if name not in models.keys():
        # print('Loading model', name_)
        # models[name] = get_model_by_name(name)
        # models[name]['pred'] = np.zeros((models[name]['vertices'].shape[0], params.n_classes))
        # models[name]['pred_count'] = 1e-6 * np.ones((models[name]['vertices'].shape[0], )) # Initiated to a very small number to avoid devision by 0
  
      sp = model_ftrs.shape
      ftrs = tf.reshape(model_ftrs, (-1, sp[-2], sp[-1]))
      predictions = dnn_model(ftrs, training=False).numpy()[:, skip:]
      all_seq = all_seq[0, :, skip + 1:].reshape(-1).astype(np.int32)
      predictions4vertex = predictions.reshape((-1, predictions.shape[-1]))
      for w_step in range(all_seq.size):
        models[model_name]['pred'][all_seq[w_step]] += predictions4vertex[w_step]
        models[model_name]['pred_count'][all_seq[w_step]] += 1


  postprocess_vertex_predictions(models)
  print(3)
  e_acc_after_postproc, v_acc_after_postproc, f_acc_after_postproc,segmentation_predict = calc_final_accuracy(models)

  return [e_acc_after_postproc, e_acc_after_postproc], dnn_model,segmentation_predict


# if __name__ == '__main__':
#   from train_val import get_params
#   utils.config_gpu(1)
#   np.random.seed(0)
#   tf.random.set_seed(0)

#   if len(sys.argv) != 4:
#     print('<>'.join(sys.argv))
#     print('Use: python evaluate_segmentation.py <job> <part> <trained model directory>')
#     print('For example: python evaluate_segmentation.py coseg chairs pretrained/0009-14.11.2020..07.08__coseg_chairs')
#   else:
#     logdir = sys.argv[3]
#     job = sys.argv[1]
#     job_part = sys.argv[2]
#     params = get_params(job, job_part)
#     dataset_expansion = params.datasets2use['test'][0]
#     accs, _ = calc_accuracy_test(logdir, dataset_expansion)
#     print('Edge accuracy:', accs[0])


def convert_obj_to_npz(obj_file, npz_file):
    # Load the OBJ file
    mesh = trimesh.load_mesh(obj_file)
    print(mesh)

    # print(np.load('datasets_processed/human_seg_from_meshcnn/test_shrec__2_not_changed_1500.npz')['labels'])

    # Extract vertices, faces, and other attributes from the mesh
    vertices = mesh.vertices
    faces = mesh.faces

    # Create a dictionary to store the data
    data = {
        'vertices': vertices,
        'faces': faces,
        'edges': mesh.edges,
        'labels': np.array([8, 8, 2, 8, 1, 2, 2, 2, 8, 5, 8, 8, 2, 1, 8, 8, 1, 1, 2, 5, 5, 1, 8, 5,
              2, 3, 1, 8, 8, 1, 8, 6, 5, 2, 8, 5, 8, 5, 8, 5, 5, 8, 8, 5, 1, 1, 8, 8,
              8, 5, 1, 1, 5, 1, 6, 5, 2, 3, 5, 4, 8, 8, 5, 5, 6, 5, 3, 3, 3, 3, 5, 5,
              8, 8, 6, 6, 6, 2, 5, 5, 5, 5, 4, 4, 1, 8, 1, 6, 3, 2, 6, 5, 5, 4, 8, 8,
              8, 4, 1, 6, 8, 4, 6, 5, 2, 5, 3, 5, 4, 1, 1, 8, 8, 8, 8, 8, 1, 6, 6, 6,
              6, 2, 2, 6, 2, 5, 5, 3, 4, 4, 5, 1, 5, 5, 6, 3, 5, 3, 3, 5, 4, 1, 8, 1,
              1, 8, 6, 2, 3, 4, 4, 5, 1, 1, 1, 8, 8, 8, 8, 4, 6, 6, 1, 8, 6, 6, 6, 3,
              2, 5, 5, 3, 4, 4, 4, 5, 1, 1, 8, 7, 5, 6, 4, 6, 5, 6, 2, 3, 6, 2, 5, 4,
              5, 4, 1, 1, 1, 8, 8, 8, 5, 8, 8, 3, 2, 8, 7, 7, 7, 7, 6, 6, 8, 6, 2, 2,
              5, 2, 3, 5, 3, 4, 4, 4, 4, 8, 3, 8, 7, 7, 5, 5, 7, 6, 6, 2, 3, 5, 3, 5,
              4, 3, 4, 4, 4, 4, 4, 8, 8, 7, 7, 6, 7, 5, 6, 3, 2, 2, 5, 5, 5, 3, 5, 4,
              5, 5, 5, 5, 1, 7, 4, 8, 5, 7, 8, 7, 7, 7, 7, 6, 6, 6, 3, 2, 5, 3, 3, 4,
              4, 4, 4, 4, 4, 1, 2, 8, 8, 8, 8, 5, 5, 7, 7, 7, 5, 3, 4, 4, 4, 8, 8, 8,
              8, 7, 7, 7, 5, 5, 6, 4, 6, 3, 5, 4, 4, 4, 8, 8, 8, 8, 3, 3, 7, 7, 7, 6,
              5, 2, 2, 3, 3, 5, 5, 5, 5, 4, 4, 8, 8, 8, 7, 7, 4, 7, 7, 8, 6, 5, 5, 4,
              4, 2, 8, 4, 7, 7, 7, 6, 8, 6, 4, 5, 2, 8, 4, 7, 8, 8, 5, 5, 5, 6, 5, 5,
              5, 5, 3, 4, 4, 4, 8, 7, 7, 7, 5, 5, 8, 5, 5, 8, 8, 8, 4, 7, 8, 5, 7, 6,
              7, 5, 4, 4, 4, 4, 8, 8, 7, 7, 7, 5, 7, 6, 5, 4, 8, 8, 7, 7, 7, 6, 4, 7,
              7, 7, 7, 6, 6, 8, 7, 7, 7, 7, 6, 5, 5, 8, 7, 7, 6, 5, 4, 8, 8, 7, 6, 6,
              5, 5, 5, 7, 7, 6, 6, 6, 5, 5, 5, 7, 6, 6, 5, 7, 6, 5, 7, 6, 5, 5, 7, 6,
              6, 5, 5, 5, 5, 7, 6, 6, 6, 5, 5, 5, 6, 6, 5, 5, 5, 5, 6, 6, 6, 6, 5, 5,
              5, 5, 6, 6, 5, 5, 6, 5, 5, 1, 6, 5, 5, 5, 5, 1, 6, 5, 5, 1, 6, 6, 5, 5,
              5, 1, 1, 1, 5, 5, 5, 5, 5, 1, 1, 1, 5, 5, 5, 5, 5, 1, 1, 5, 5, 5, 1, 1,
              5, 5, 1, 5, 1, 5, 5, 5, 5, 5, 5, 5, 5, 1, 5, 5, 5, 5, 1, 1, 5, 5, 5, 5,
              5, 1, 5, 1, 1, 6, 5, 5, 1, 1, 6, 6, 5, 5, 5, 6, 5, 5, 5, 5, 5, 1, 6, 5,
              5, 5, 5, 7, 6, 5, 5, 5, 7, 6, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 6,
              6, 6, 6, 5, 6, 6, 6, 5, 5, 5, 5, 5, 6, 5, 7, 7, 6, 6, 5, 5, 5, 5, 8, 7,
              7, 6, 5, 5, 8, 8, 7, 7, 7, 6, 5, 5, 5, 5, 8, 7, 7, 7, 7, 7, 7, 6, 6, 6,
              5, 8, 8, 7, 7, 6, 6, 6, 5, 5, 5, 5, 5, 5, 8, 4, 4, 8, 7, 7, 5, 5, 5, 4,
              7, 5, 7, 7, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 3,
              4, 4, 4, 4, 4, 4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 3, 2, 3, 2, 2, 2, 2,
              2, 2, 2, 2, 2, 2, 2, 2])
    }


    # Save the data as an NPZ file
    np.savez(npz_file, **data)


def main(job, job_part, logdir,file_obj):
  from train_val import get_params
  utils.config_gpu(1)
  np.random.seed(0)
  tf.random.set_seed(0)
  params = get_params(job, job_part)
  dataset_expansion = params.datasets2use['test'][0]
  npz_file = "datasets_raw/from_meshcnn/human_seg/npz/"+file_obj.split("/")[-1].split(".")[0]+".npz"
  print(npz_file)
  convert_obj_to_npz(file_obj, npz_file)
  accs, _,segements = calc_accuracy_test(logdir,dataset_expansion=dataset_expansion, file_path=npz_file)
  print('Edge accuracy:', accs[0])
  return segements